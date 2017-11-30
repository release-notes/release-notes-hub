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
      '/': {
        handler: (req, res, next) => this.indexAction(req, res, next)
      },
      '/credits': {
        handler: (req, res, next) => res.render('legal/credits')
      },
      '/imprint': {
        handler: (req, res, next) => res.render('legal/imprint')
      },
      '/mit-license': {
        handler: (req, res, next) => res.render('legal/mit-license')
      },
      '/privacy-policies': {
        handler: (req, res, next) => res.render('legal/privacy-policies')
      },
      '/terms-of-service': {
        handler: (req, res, next) => res.render('legal/terms-of-service')
      }
    }
  };
}

module.exports = IndexController;
