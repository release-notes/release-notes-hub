const expressOpenapi = require('express-openapi');
const Service = require('kermit/Service');
const apiDocV1 = require('../api/openapi-v1');

class ApiService extends Service {
  bind(expressApp) {
    const version = this.serviceConfig.get('version');

    expressOpenapi.initialize({
      app: expressApp,
      apiDoc: apiDocV1({ version }),
      paths: './api/v1',
      docsPath: '/api-spec',
      exposeApiDocs: true,
      validateApiDoc: true,
      dependencies: {
        version,
      },
      securityHandlers: {
        Bearer: function(req, scopes, definition, callback) {
          // always pass for now
          console.warn(req.headers.authorization);

          callback(null, true);
        },
      },
    });
  }
}

module.exports = ApiService;
