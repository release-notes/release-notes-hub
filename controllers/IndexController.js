'use strict';

const AbstractController = require('./AbstractController');

class IndexController extends AbstractController {
  async indexAction(req, res) {
    const releaseNotesList = await this.serviceManager.get('releaseNotesRepository').findNewest(6);

    res.render('index/index', {
      newest: releaseNotesList,
    });
  }

  getRoutes() {
    return {
      '/': {
        handler: (req, res, next) => this.indexAction(req, res, next)
      },
      '/about': {
        handler: (req, res, next) => res.render('index/about')
      },
      '/credits': {
        handler: (req, res, next) => res.render('legal/credits')
      },
      '/contribute': {
        handler: (req, res, next) => res.render('index/contribute')
      },
      '/faq': {
        handler: (req, res, next) => res.render('faq/index')
      },
      '/how-it-works': {
        handler: (req, res, next) => res.render('index/how-it-works')
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
