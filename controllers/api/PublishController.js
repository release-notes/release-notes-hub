'use strict';

const AbstractController = require('../AbstractController');
const ReleaseNotesLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const multer = require('multer');

const releaseNotesLoader = new ReleaseNotesLoader();
const uploadHandler = multer();

class PublishController extends AbstractController {
  publishAction(req, res, next) {
    releaseNotesLoader.loadReleaseNotes(req.file.buffer, (err, releaseNotes) => {
      res.json({
        err,
        releaseNotes,
      });
    });
  }

  getRoutes() {
    return {
      '/api/publish': {
        method: 'post',
        handler: [
          uploadHandler.single('release-notes'),
          (req, res, next) => this.publishAction(req, res, next),
        ]
      }
    }
  };
}

module.exports = PublishController;
