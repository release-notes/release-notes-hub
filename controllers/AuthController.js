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

  signUpAction(req, res, next) {
    const accountService = this.serviceManager.get('accountService');
    const targetUrl = this.getTargetUrl(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void res.render('auth/signup', {
        errors: errors.mapped(),
        form: req.body,
        targetUrl: targetUrl,
      });
    }

    accountService.createAccountWithCredentials({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    }, (err, account) => {
      if (err) {
        return void next(err);
      }

      req.logIn(account, (loginErr) => {
        if (loginErr) {
          return void next(loginErr);
        }

        res.redirect(targetUrl || '/');
      });
    });
  }

  signOutAction(req, res, next) {
    req.logout();
    res.redirect('/');
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

  getRoutes() {
    const authService = this.authService;

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
      }
    }
  };
}

module.exports = AuthController;
