'use strict';

const AbstractService = require('kermit/Service');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');

class AuthService extends AbstractService {
  constructor(serviceManager) {
    super(serviceManager);

    this.passport = new passport.Authenticator();
  }

  bootstrap() {
    this.accountService = this.serviceManager.get('accountService');
    this.registerCredentialsStrategy();
    this.initializeUserSessionSerialization();

    return this;
  }

  initializeUserSessionSerialization() {
    this.passport.serializeUser((user, callback) => {
      callback(null, user._id);
    });

    this.passport.deserializeUser((id, callback) => {
      this.accountService.findById(id, (err, user) => {
        if (user) {
          user.id = id;
        }

        callback(err, user)
      });
    });
  }

  registerCredentialsStrategy() {
    this.passport.use('credentials', new LocalStrategy({
      usernameField: 'email',
    }, (username, password, done) => {
        this.accountService.authenticateWithCredentials({
          email: username,
          password: password
        }, (err, user) => {
          if (err || !user) {
            return void done(null, false, { message: 'Invalid credentials.' });
          }

          done(null, user);
        });
      }
    ));
  }

  requireUser() {
    return (req, res, next) => {
      if (req.user) {
        return void next();
      }

      let redirectUrl = '/signin';

      if (req.url !== '/signin') {
        redirectUrl += `?targetUrl=${req.url}`;
      }

      res.redirect(redirectUrl);
    };
  }

  authenticate(strategy, options) {
    return this.passport.authenticate(strategy, options);
  }

  registerMiddleware(server) {
    server.use(this.passport.initialize());
    server.use(this.passport.session());
    server.use((req, res, next) => {
      res.locals.user = req.user;
      next();
    });
  }
}

module.exports = AuthService;
