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
      exposeApiDocs: true,
      validateApiDoc: true,
      dependencies: {
        version,
      }
    });
  }
}

module.exports = ApiService;
