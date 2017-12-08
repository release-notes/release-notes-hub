'use strict';

const AbstractController = require('./AbstractController');

class AuthTokenController extends AbstractController {
  constructor(serviceManager) {
    super(serviceManager);

    this.authTokenRepository = null;
  }

  bootstrap() {
    super.bootstrap();

    this.authTokenRepository = this.serviceManager.get('authTokenRepository');

    return this;
  }

  async renderListView(req, res, next) {
    try {
      const authTokenList = await this.authTokenRepository.findAllByAccountId(req.user._id);

      res.render('auth-tokens/list', {
        authTokenList,
      });
    } catch (err) {
      next(err);
    }
  }

  async createAuthTokenAction(req, res, next) {
    try {
      const authTokenProps = {
        accountId: req.user._id,
      };

      if (req.body.description) {
        authTokenProps.description = req.body.description;
      }

      await this.authTokenRepository.create(authTokenProps);
      res.redirect('/auth-tokens');
    } catch (err) {
      next(err);
    }
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/auth-tokens': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderListView(req, res, next),
        ],
      }],
      '/auth-tokens/new': [{
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.createAuthTokenAction(req, res, next),
        ]
      }]
    };
  }
}

module.exports = AuthTokenController;
