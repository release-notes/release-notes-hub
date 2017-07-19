'use strict';

const AbstractController = require('./AbstractController');
const ReleaseNotesLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const ReleaseNotesDataModel = require('@release-notes/node/lib/models/ReleaseNotes');
const multer = require('multer');

const releaseNotesLoader = new ReleaseNotesLoader();
const uploadHandler = multer();

class ReleaseNotesController extends AbstractController {
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

      const releaseNotesRepository = this.serviceManager.get('releaseNotesRepository');
      releaseNotesRepository.create(releaseNotesData, (err, releaseNotesModel) => {
        if (err) {
          return void next(err);
        }

        res.redirect(`/@${releaseNotesModel.scope}/${releaseNotesModel.name}`);
      });
    });
  }

  renderRealeaseNotesView(req, res, next) {
    this.serviceManager.get('releaseNotesRepository').findOneByScopeAndName(
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

  getRoutes() {
    return {
      '/publish': [{
        method: 'get',
        handler: [
          this.serviceManager.get('authService').authenticate('session', { failureRedirect: '/signin' }),
          (req, res, next) => this.renderPublishView(req, res, next)
        ]
      }, {
        method: 'post',
        handler: [
          this.serviceManager.get('authService').authenticate('session', { failureRedirect: '/signin' }),
          uploadHandler.single('release-notes'),
          (req, res, next) => this.publishAction(req, res, next)
        ]
      }],
      '/@:scope/:releaseNotesId': {
        handler: (req, res, next) => this.renderRealeaseNotesView(req, res, next),
      }
    }
  };
}

module.exports = ReleaseNotesController;
