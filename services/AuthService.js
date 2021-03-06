'use strict';

const AbstractService = require('kermit/Service');
const GitHubStrategy = require('passport-github2');
const GoogleStrategy = require('passport-google-oauth20');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');

class AuthService extends AbstractService {
  constructor(serviceManager) {
    super(serviceManager);

    this.passport = new passport.Authenticator();
  }

  bootstrap() {
    this.accountService = this.serviceManager.get('accountService');
    this.logger = this.serviceManager.get('logging');
    this.registerCredentialsStrategy();
    this.registerGitHubStrategy();
    this.registerGoogleStrategy();
    this.initializeUserSessionSerialization();

    return this;
  }

  initializeUserSessionSerialization() {
    this.passport.serializeUser((user, callback) => {
      callback(null, user._id);
    });

    this.passport.deserializeUser(async (id, callback) => {
      try {
        const user = await this.accountService.getRepository().findById(id);

        if (user) {
          user.id = id;
        }
        callback(null, user);
      } catch (err) {
        next(err);
      }
    });
  }

  registerCredentialsStrategy() {
    this.passport.use('credentials', new LocalStrategy({
      usernameField: 'email',
    }, async (username, password, done) => {
        try {
          const user = await this.accountService.authenticateWithCredentials({
            email: username,
            password: password
          });

          if (!user) {
            return void done(null, false, { message: 'Invalid credentials.' });
          }

          done(null, user);
        } catch (err) {
          return void done(null, false, { message: 'Invalid credentials.' });
        }
      }
    ));
  }

  registerOAuthStrategy({ provider, scope, Strategy }) {
    const serviceConfig = this.serviceConfig.get(provider);

    this.passport.use(new Strategy({
      clientID: serviceConfig.clientId,
      clientSecret: serviceConfig.clientSecret,
      callbackURL: `/auth/${provider}/callback`,
      scope,
    }, async (accessToken, refreshToken, profile, done) => {
      if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        this.logger.warn(`${provider} auth failed to retrieve user email.`);

        return done(null, false);
      }

      const accountRepository = this.accountService.getRepository();
      const email = profile.emails[0].value;
      let user = await accountRepository.findOneByEmail(email);

      if (!user) {
        user = await accountRepository.create({ email });
      }

      return done(null, user);
    }));
  }

  registerGoogleStrategy() {
    this.registerOAuthStrategy({
      provider: 'google',
      scope: ['email'],
      Strategy: GoogleStrategy,
    });
  }

  registerGitHubStrategy() {
    this.registerOAuthStrategy({
      provider: 'github',
      scope: ['user:email'],
      Strategy: GitHubStrategy,
    });
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
