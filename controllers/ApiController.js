'use strict';

const AbstractController = require('./AbstractController');

class ApiController extends AbstractController {
  indexAction(req, res) {
    res.render('api/index', {
      apiSpecUrl: `${this.serviceConfig.get('baseUrl')}/v1/api-spec`
    });
  }

  getRoutes() {
    return {
      '/api': {
        handler: (req, res, next) => this.indexAction(req, res, next)
      },
      '/api/*': {
        handler: (req, res) => res.status(404).json({ code: 'ENDPOINT_NOT_FOUND' })
      }
    };
  };
}

module.exports = ApiController;
