'use strict';

const { check, validationResult } = require('express-validator/check');
const AbstractController = require('./AbstractController');

class AuthController extends AbstractController {
  renderSignInAction(req, res, next) {
    res.render('auth/signin', {
      targetUrl: this.getTargetUrl(req),
    });
  }

  renderSignUpAction(req, res, next) {
    res.render('auth/signup', {
      targetUrl: this.getTargetUrl(req),
    });
  }

  async signUpAction(req, res, next) {
    const accountService = this.serviceManager.get('accountService');
    const targetUrl = this.getTargetUrl(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void res.render('auth/signup', {
        targetUrl,
        errors: errors.mapped(),
        form: req.body,
      });
    }

    try {
      const account = await accountService.createAccountWithCredentials({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
      });

      req.logIn(account, (loginErr) => {
        if (loginErr) {
          return void next(loginErr);
        }

        res.redirect(targetUrl || '/');
      });
    } catch (err) {
      const formError = AuthController.mapSignupError(err);

      if (formError) {
        return void res.render('auth/signup', {
          targetUrl,
          errors: formError,
          form: req.body,
        });
      }

      return void next(err);
    }
  }

  signOutAction(req, res, next) {
    req.logout();
    res.redirect('/');
  }

  async publishClaimUsernameAction(req, res, next) {
    const accountService = this.serviceManager.get('accountService');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void res.render('release-notes/publish', {
        errors: errors.mapped(),
        form: req.body
      });
    }

    const username = req.body.username;

    try {
      const account = accountService.getRepository().findOneByUsername(username);

      if (account) {
        return void res.render('release-notes/publish', {
          errors: {
            username: {
              msg: `@${username} is already taken.`,
            },
          },
          form: req.body
        });
      }

      await accountService.getRepository().findByIdAndUpdate(req.user._id, { username });

      res.redirect('/publish');
    } catch (err) {
      const formError = AuthController.mapSignupError(err);

      if (formError) {
        return void res.render('release-notes/publish', {
          errors: formError,
          form: req.body,
        });
      }

      return void next(err);
    }
  }

  getTargetUrl(req) {
    const targetUrl = req.body.targetUrl || req.query.targetUrl;

    if (targetUrl && targetUrl[0] === '/' && targetUrl[1] !== '/') {
      return targetUrl;
    }

    return '';
  }

  redirectToTargetUrl(req, res) {
    const targetUrl = this.getTargetUrl(req) || '/';

    res.redirect(targetUrl);
  }

  static mapSignupError(err) {
    if (err.message === 'Email is already in use.') {
      return {
        email: {
          msg: err.message,
        },
      };
    }

    if (err.message === 'Username is already in use.'
      || err.message.indexOf('username_1 dup key') !== -1
    ) {
      return {
        username: {
          msg: 'Username is already in use.',
        },
      };
    }

    return null;
  }

  getOAuthHandler({ provider, scope }) {
    const baseUrl = this.getServiceManager().get('app.config').get('app.baseUrl');

    return (req, res, next) => this.authService.authenticate(provider, {
      scope,
      callbackURL: `${baseUrl}/auth/${provider}/callback`,
      state: encodeURIComponent(JSON.stringify({
        targetUrl: this.getTargetUrl(req),
      }))
    })(req, res, next)
  }

  getOAuthCallbackHandler({ provider }) {
    return [
      this.authService.authenticate(provider, { failureRedirect: '/signin' }),
      (req, res) => {
        if (req.query.state) {
          try {
            const state = JSON.parse(decodeURIComponent(req.query.state));

            if (state.targetUrl) {
              req.query.targetUrl = state.targetUrl;
            }
          } catch (err) {
            this.logger.warn(`Failed to parse ${provider} oauth state parameter.`, err);
          }
        }

        this.redirectToTargetUrl(req, res);
      }
    ];
  }

  getRoutes() {
    const authService = this.authService;
    const baseUrl = this.getServiceManager().get('app.config').get('app.baseUrl');

    return {
      '/signin': [{
        method: 'get',
        handler: (req, res, next) => this.renderSignInAction(req, res, next),
      }, {
        method: 'post',
        handler: [
          authService.authenticate('credentials', { failureRedirect: '/signin' }),
          (req, res) => this.redirectToTargetUrl(req, res),
        ]
      }],
      '/signup': [{
        method: 'get',
        handler: (req, res, next) => this.renderSignUpAction(req, res, next),
      }, {
        method: 'post',
        handler: [
          check('username', 'Username must be alphanumeric and may contain dashes.')
            .optional({ checkFalsy: true })
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          check('email', 'Please provide a valid email address.')
            .isEmail(),
          check('password', 'Please provide a stronger password. (min 10 chars)')
            .isLength({ min: 10 }),

          (req, res, next) => this.signUpAction(req, res, next),
        ]
      }],
      '/signout': {
        method: 'get',
        handler: [
          authService.authenticate('session'),
          (req, res, next) => this.signOutAction(req, res, next),
        ]
      },
      '/publish-claim-username': {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('username', 'Username must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.publishClaimUsernameAction(req, res, next),
        ]
      },
      '/auth/github': {
        handler: this.getOAuthHandler({ provider: 'github', scope: ['user:email'] }),
      },
      '/auth/github/callback': {
        handler: this.getOAuthCallbackHandler({ provider: 'github' }),
      },
      '/auth/google': {
        handler: this.getOAuthHandler({ provider: 'google', scope: ['email'] }),
      },
      '/auth/google/callback': {
        handler: this.getOAuthCallbackHandler({ provider: 'google' }),
      }
    }
  };
}

module.exports = AuthController;
