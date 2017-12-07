'use strict';

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
   * @property {UpdateService} updateService
   * @property {NotificationService} notificationService
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.releaseNotesRepository = sm.get('releaseNotesRepository');
    this.subscriptionRepository = sm.get('subscriptionRepository');
    this.notificationService = sm.get('releaseNotesNotificationService');
    this.updateService = sm.get('releaseNotesUpdateService');

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

    releaseNotesLoader.loadReleaseNotes(req.file.buffer, async (err, releaseNotes) => {
      if (err) {
        res.statusCode = 400;
        res.render('release-notes/publish', { err });
      }

      const releaseNotesData = releaseNotes.toJSON();
      releaseNotesData.ownerAccountId = req.user._id;
      releaseNotesData.scope = req.user.username;
      releaseNotesData.name = req.body.name;

      try {
        const releaseNotesModel = await this.releaseNotesRepository.create(releaseNotesData)
        res.redirect(`/@${releaseNotesModel.scope}/${releaseNotesModel.name}`);
      } catch (err) {
        next(err);
      }
    });
  }

  async renderMyReleaseNotesView(req, res, next) {
    try {
      const releaseNotesList = await this.releaseNotesRepository.findAllByOwnerAccountId(req.user._id);
      res.render('release-notes/private-list', { releaseNotesList });
    } catch (err) {
      next(err);
    }
  }

  async editReleaseNotesAction(req, res, next) {
    try {
      const releaseNotes = await this.releaseNotesRepository.findById(req.params.releaseNotesId);

      if (releaseNotes.ownerAccountId !== req.user.id) {
        return void next();
      }

      res.render('release-notes/edit', {
        releaseNotes,
        releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
        releaseNotesId: releaseNotes._id,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReleaseNotesAction(req, res, next) {
    try {
      const releaseNotes = await this.releaseNotesRepository.findById(req.params.releaseNotesId);

      if (releaseNotes.ownerAccountId !== req.user.id) {
        return void next();
      }

      const viewVariables = {
        releaseNotes,
        releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
        releaseNotesId: releaseNotes._id,
      };

      if (!req.file) {
        viewVariables.errors = {file: {msg: 'No release-notes.yml file was uploaded.'}};
        return void res.render('release-notes/edit', viewVariables);
      }

      releaseNotesLoader.loadReleaseNotes(
        req.file.buffer,
        async (releaseNotesValidationErr, releaseNotesUpdate) => {
          try {
            if (releaseNotesValidationErr) {
              viewVariables.errors = {validation: {msg: releaseNotesValidationErr.message}};
              res.statusCode = 400;
              res.render('release-notes/edit', viewVariables);
            }

            this.notificationService.sendReleaseNotesUpdateNotification(releaseNotes, releaseNotesUpdate);

            const updatedReleaseNotes = await this.updateService.applyUpdate(
              releaseNotes,
              releaseNotesUpdate
            );

            viewVariables.releaseNotesDataModel = ReleaseNotesDataModel.fromJSON(updatedReleaseNotes);

            res.render('release-notes/edit', viewVariables);
          } catch (err) {
            return void next(err);
          }
        }
      );
    } catch (err) {
      next(err);
    }
  }

  async renderRealeaseNotesView(req, res, next) {
    const params = req.params;
    const releaseNotesName = params.releaseNotesId;
    const releaseNotesScope = params.scope;

    try {
      const [releaseNotesModel, subscriptions] = await Promise.all([
        this.releaseNotesRepository.findOneByScopeAndName(
          releaseNotesScope, releaseNotesName
        ),
        req.user ? this.subscriptionRepository.findBySubscriberAndReleaseNotes({
          releaseNotesName,
          releaseNotesScope,
          subscriberId: req.user._id
        }) : [],
      ]);

      const isSubscribed = subscriptions.length;

      // not found
      if (!releaseNotesModel) return void next();

      res.render('release-notes/detail', {
        releaseNotesModel,
        isSubscribed,
        releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotesModel),
        releaseNotesName: releaseNotesModel.name,
        scope: releaseNotesModel.scope,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderAccountRealeaseNotesListView(req, res, next) {
    const scope = req.params.scope;

    try {
      const releaseNotesList = await this.releaseNotesRepository.findAllByScope(scope);
      res.render('release-notes/list', {
        releaseNotesList,
        scope,
      });
    } catch (err) {
      next(err);
    }
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
