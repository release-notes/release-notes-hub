'use strict';

const AbstractController = require('./AbstractController');
const ReleaseNotesLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const ReleaseNotesDataModel = require('@release-notes/node/lib/models/ReleaseNotes');
const multer = require('multer');

const releaseNotesLoader = new ReleaseNotesLoader();
const uploadHandler = multer();

class ReleaseNotesController extends AbstractController {
  bootstrap() {
    super.bootstrap();

    /* @var {ReleaseNotesRepository} */
    this.releaseNotesRepository = this.serviceManager.get('releaseNotesRepository');

    return this;
  }

  renderPublishView(req, res, next) {
    res.render('release-notes/publish');
  }

  publishAction(req, res, next) {
    if (!req.file) {
      return void res.render('release-notes/publish', {
        err: new Error('No release-notes.yml file was uploaded.')
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

  renderRealeaseNotesView(req, res, next) {
    this.releaseNotesRepository.findOneByScopeAndName(
      req.params.scope,
      req.params.releaseNotesId,
      (err, releaseNotesModel) => {
        if (err) {
          return void next(err);
        }

        // not found
        if (!releaseNotesModel) {
          return void next();
        }

        res.render('release-notes/detail', {
          releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotesModel)
        });
      }
    );
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
          (req, res, next) => this.publishAction(req, res, next)
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
