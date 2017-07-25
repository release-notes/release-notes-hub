'use strict';

const AbstractController = require('./AbstractController');

class IndexController extends AbstractController {
  indexAction(req, res, next) {
    this.serviceManager.get('releaseNotesRepository').findNewest(
      6, (err, releaseNotesList) => {
        if (err) {
          return void next(err);
        }

        res.render('index/index', {
          newest: releaseNotesList,
        });
      }
    );
  }

  getRoutes() {
    return {
      '/': [{
        handler: (req, res, next) => this.indexAction(req, res, next)
      }],
    }
  };
}

module.exports = IndexController;
