'use strict';

const AbstractController = require('./AbstractController');

class AuthController extends AbstractController {
  renderSignInAction(req, res, next) {
    res.render('auth/signin');
  }

  renderSignUpAction(req, res, next) {
    res.render('auth/signup');
  }

  signUpAction(req, res, next) {
    const accountService = this.serviceManager.get('accountService');

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

        res.redirect('/');
      });
    });
  }

  signOutAction(req, res, next) {
    req.logout();
    res.redirect('/');
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/signin': [{
        method: 'get',
        handler: (req, res, next) => this.renderSignInAction(req, res, next)
      }, {
        method: 'post',
        handler: authService.authenticate('credentials', {
          successRedirect: '/',
          failureRedirect: '/signin',
        })
      }],
      '/signup': [{
        method: 'get',
        handler: (req, res, next) => this.renderSignUpAction(req, res, next)
      }, {
        method: 'post',
        handler: (req, res, next) => this.signUpAction(req, res, next)
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
