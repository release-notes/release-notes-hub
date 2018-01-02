const bodyParser = require('body-parser');
const expressOpenapi = require('express-openapi');
const multer = require('multer');
const Service = require('kermit/Service');
const apiDocV1 = require('../api/openapi-v1');

const BEARER_AUTH_HEADER_REGEX = /^Bearer\s+[0-9a-zA-Z+=\/]+$/;

class ApiService extends Service {
  static get BEARER_AUTH_HEADER_REGEX() {
    return BEARER_AUTH_HEADER_REGEX;
  }

  bind(expressApp) {
    const version = this.serviceConfig.get('version');
    const serviceManager = this.serviceManager;
    const authTokenRepository = serviceManager.get('authTokenRepository');

    expressOpenapi.initialize({
      app: expressApp,
      apiDoc: apiDocV1({ version }),
      paths: './api/v1',
      docsPath: '/api-spec',
      exposeApiDocs: true,
      validateApiDoc: true,
      dependencies: {
        version,
        serviceManager,
      },
      consumesMiddleware: {
        'application/json': bodyParser.json(),
        'multipart/form-data'(req, res, next) {
          multer().single('file')(req, res, (err) => {
            if (err) return next(err);

            req.body.file = req.file;
            next();
          });
        }
      },
      securityHandlers: {
        async Bearer(req, scopes, definition, callback) {
          const authHeader = req.headers.authorization;

          if (!ApiService.isValidBearerAuthHeader(authHeader)) {
            return callback({
              status: 401,
              challenge: 'Bearer',
              message: {
                code: 'INVALID_AUTH_HEADER',
                message: 'Missing or invalid authorization header.',
              },
            });
          }

          const bearerToken = ApiService.parseBearerToken(authHeader);

          try {
            const auth = await authTokenRepository.findOneByToken(bearerToken);

            if (!auth) {
              return callback({
                status: 401,
                challenge: 'Bearer',
                message: {
                  code: 'NOT_AUTHORIZED',
                  message: 'Error verifying access token.',
                },
              });
            }

            req.auth = auth;
            callback(null, true);
          } catch (err) {
            callback(err);
          }
        },
      },
    });
  }

  static isValidBearerAuthHeader(bearerAuthHeader) {
    return ApiService.BEARER_AUTH_HEADER_REGEX.test(bearerAuthHeader);
  }

  static parseBearerToken(bearerAuthHeader) {
    return bearerAuthHeader.substr(bearerAuthHeader.lastIndexOf(' ') + 1);
  }
}

module.exports = ApiService;
