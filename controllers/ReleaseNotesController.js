'use strict';

const async = require('async');
const AbstractController = require('./AbstractController');
const ReleaseNotesLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const ReleaseNotesDataModel = require('@release-notes/node/lib/models/ReleaseNotes');
const { check, validationResult } = require('express-validator/check');
const multer = require('multer');

const releaseNotesLoader = new ReleaseNotesLoader();
const uploadHandler = multer();

class ReleaseNotesController extends AbstractController {
  /**
   * @property {SubscriptionRepository} subscriptionRepository
   * @property {ReleaseNotesRepository} releaseNotesRepository
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.releaseNotesRepository = sm.get('releaseNotesRepository');
    this.subscriptionRepository = sm.get('subscriptionRepository');

    return this;
  }

  renderPublishView(req, res, next) {
    res.render('release-notes/publish');
  }

  publishAction(req, res, next) {
    if (!req.file) {
      return void res.render('release-notes/publish', {
        errors: {
          file: {
            msg: 'No release-notes.yml file was uploaded.',
          },
        },
        form: req.body
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void res.render('release-notes/publish', {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    releaseNotesLoader.loadReleaseNotes(req.file.buffer, (err, releaseNotes) => {
      if (err) {
        res.statusCode = 400;
        res.render('release-notes/publish', { err });
      }

      const releaseNotesData = releaseNotes.toJSON();
      releaseNotesData.ownerAccountId = req.user._id;
      releaseNotesData.scope = req.user.username;
      releaseNotesData.name = req.body.name;

      this.releaseNotesRepository.create(releaseNotesData, (err, releaseNotesModel) => {
        if (err) {
          return void next(err);
        }

        res.redirect(`/@${releaseNotesModel.scope}/${releaseNotesModel.name}`);
      });
    });
  }

  renderMyReleaseNotesView(req, res, next) {
    this.releaseNotesRepository.findAllByOwnerAccountId(
      req.user._id,
      (err, releaseNotesList) => {
        if (err) {
          return void next(err);
        }

        res.render('release-notes/private-list', {
          releaseNotesList,
        });
      }
    );
  }

  editReleaseNotesAction(req, res, next) {
    this.releaseNotesRepository.findById(req.params.releaseNotesId, (err, releaseNotes) => {
      if (err) return void next(err);

      if (releaseNotes.ownerAccountId !== req.user.id) {
        return void next();
      }

      res.render('release-notes/edit', {
        releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotes),
        releaseNotesId: releaseNotes._id,
      });
    });
  }

  updateReleaseNotesAction(req, res, next) {
    this.releaseNotesRepository.findById(req.params.releaseNotesId, (err, releaseNotes) => {
      if (err) return void next(err);

      if (releaseNotes.ownerAccountId !== req.user.id) {
        return void next();
      }

      const viewVariables = {
        releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotes),
        releaseNotesId: releaseNotes._id,
      };

      if (!req.file) {
        viewVariables.errors = { file: { msg: 'No release-notes.yml file was uploaded.' } };
        return void res.render('release-notes/edit', viewVariables);
      }

      releaseNotesLoader.loadReleaseNotes(
        req.file.buffer,
        (releaseNotesValidationErr, releaseNotesUpdate) => {
          if (releaseNotesValidationErr) {
            viewVariables.errors = { validation: { msg: releaseNotesValidationErr.message } };
            res.statusCode = 400;
            res.render('release-notes/edit', viewVariables);
          }

          this.releaseNotesRepository.findByIdAndUpdate(
            releaseNotes._id,
            { $set: releaseNotesUpdate },
            (releaseNotesUpdateErr, updatedReleaseNotes) => {
              if (releaseNotesUpdateErr) return void next(releaseNotesUpdateErr);

              viewVariables.releaseNotes = ReleaseNotesDataModel.fromJSON(updatedReleaseNotes);

              res.render('release-notes/edit', viewVariables);
            }
          );
        }
      );
    });
  }

  renderRealeaseNotesView(req, res, next) {
    const params = req.params;
    const releaseNotesName = params.releaseNotesId;
    const releaseNotesScope = params.scope;

    async.parallel({
      releaseNotesModel: (taskCallback) => this.releaseNotesRepository.findOneByScopeAndName(
        releaseNotesScope, releaseNotesName, taskCallback
      ),
      isSubscribed: (taskCallback) => {
        if (!req.user) return void taskCallback(null, false);

        this.subscriptionRepository.findBySubscriberAndReleaseNotes({
          releaseNotesName,
          releaseNotesScope,
          subscriberId: req.user._id
        }, (lookupError, subscriptions) => taskCallback(
          lookupError, subscriptions && subscriptions.length
        ));
      },
    }, (err, results) => {
      if (err) return void next(err);

      const releaseNotesModel = results.releaseNotesModel;
      const isSubscribed = results.isSubscribed;

      // not found
      if (!releaseNotesModel) return void next();

      res.render('release-notes/detail', {
        releaseNotesModel,
        isSubscribed,
        releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotesModel),
        releaseNotesName: releaseNotesModel.name,
        scope: releaseNotesModel.scope,
      });
    });
  }

  renderAccountRealeaseNotesListView(req, res, next) {
    const scope = req.params.scope;

    this.releaseNotesRepository.findAllByScope(
      scope,
      (err, releaseNotesList) => {
        if (err) {
          return void next(err);
        }

        res.render('release-notes/list', {
          releaseNotesList,
          scope,
        });
      }
    );
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/publish': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderPublishView(req, res, next)
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          uploadHandler.single('release-notes'),
          check('name', 'Name must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.publishAction(req, res, next)
        ]
      }],
      '/release-notes': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderMyReleaseNotesView(req, res, next)
        ]
      }],
      '/release-notes/:releaseNotesId': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.editReleaseNotesAction(req, res, next)
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          uploadHandler.single('release-notes'),
          (req, res, next) => this.updateReleaseNotesAction(req, res, next)
        ]
      }],
      '/@:scope': {
        handler: (req, res, next) => this.renderAccountRealeaseNotesListView(req, res, next),
      },
      '/@:scope/:releaseNotesId': {
        handler: (req, res, next) => this.renderRealeaseNotesView(req, res, next),
      }
    }
  };
}

module.exports = ReleaseNotesController;
