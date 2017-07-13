'use strict';

const AbstractController = require('./AbstractController');
const ReleaseNotesLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const multer = require('multer');

const releaseNotesLoader = new ReleaseNotesLoader();
const uploadHandler = multer();

class IndexController extends AbstractController {
  indexAction(req, res, next) {
    res.render('index/index', {});
  }

  showReleaseNotesAction(req, res, next) {
    if (!req.file) {
      return void res.render('index/index', {
        err: new Error('No release-notes.yml file was uploaded.')
      });
    }

    releaseNotesLoader.loadReleaseNotes(req.file.buffer, (err, releaseNotes) => {
      if (err) {
        res.statusCode = 400;
      }

      res.render('index/index', {
        err,
        releaseNotes,
      })
    });
  }

  getRoutes() {
    return {
      '/': [{
        handler: (req, res, next) => this.indexAction(req, res, next)
      }, {
        method: 'post',
        handler: [
          uploadHandler.single('release-notes'),
          (req, res, next) => this.showReleaseNotesAction(req, res, next),
        ]
      }],
    }
  };
}

module.exports = IndexController;
