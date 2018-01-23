'use strict';

const assetRev = require('../lib/asset-rev');
const svgEmbed = require('../lib/svg-embed');

const APP_PATH = `${__dirname}/..`;
const env = process.env;
const APP_HOST = env.HOST || 'release-notes.com';
const APP_BASE_URL = env.BASE_URL || `https://${APP_HOST}`;

module.exports = {
  app: {
    services: {
      // utilities
      observer: 'kermit-service-observer/ObserverService',

      // infrastructure
      logging: `kermit-bunyan/LoggingService`,
      mongoose: `kermit-mongoose/ConnectionService`,

      // server
      express: `${APP_PATH}/services/ExpressService`,
      authService: `${APP_PATH}/services/AuthService`,
      api: `${APP_PATH}/services/ApiService`,

      // controllers
      errorController: `${APP_PATH}/controllers/ErrorController`,
      indexController: `${APP_PATH}/controllers/IndexController`,
      apiController: `${APP_PATH}/controllers/ApiController`,
      authController: `${APP_PATH}/controllers/AuthController`,
      authTokenController: `${APP_PATH}/controllers/AuthTokenController`,
      releaseNotesController: `${APP_PATH}/controllers/ReleaseNotesController`,
      subscriptionController: `${APP_PATH}/controllers/SubscriptionController`,

      // repositories
      accountRepository: `${APP_PATH}/repositories/AccountRepository`,
      authTokenRepository: `${APP_PATH}/repositories/AuthTokenRepository`,
      releaseNotesRepository: `${APP_PATH}/repositories/ReleaseNotesRepository`,
      subscriptionRepository: `${APP_PATH}/repositories/SubscriptionRepository`,

      // model services
      accountService: `${APP_PATH}/services/AccountService`,

      // business logic services
      releaseNotesLoader: `${APP_PATH}/services/releaseNotes/Loader`,
      releaseNotesUpdateService: `${APP_PATH}/services/releaseNotes/UpdateService`,
      releaseNotesNotificationService: `${APP_PATH}/services/releaseNotes/NotificationService`,
      emailService: `${APP_PATH}/services/EmailService`,

      // 3rd party
      sparkPost: `${APP_PATH}/services/SparkPostService`,
    },

    baseUrl: APP_BASE_URL,
  },

  logging: {
    bunyan: {
      name: 'Release Notes Logger',
      appName: 'hub',
      level: 'debug',
      stream: require('bunyan-format')({
        outputMode: 'long',
        color: false
      })
    }
  },

  mongoose: {
    connection: {
      host: process.env.MONGODB_HOST || 'release-notes-mongo',
      port: process.env.MONGODB_PORT || '27017',
      user: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD,
      database: process.env.MONGODB_DATABASE || 'release-notes'
    }
  },

  express: {
    server: {},
    settings: {
      'views': `${APP_PATH}/views`,
      'view engine': 'pug',
      'trust proxy': true,
    },
    port: process.env.PORT || '8080',
    controllers: [
      'api',
      'apiController',
      'authController',
      'authTokenController',
      'releaseNotesController',
      'subscriptionController',
      'indexController',
      'errorController',
    ],
    viewVariables: {
      asset: assetRev({
        enabled: process.env.ENABLE_ASSET_REV !== 'false'
      }),
      mdi: svgEmbed({
        path: `${APP_PATH}/node_modules/mdi-svg/svg/`
      }),
      moment: '@require:moment',
      marked: '@require:marked',
      piwikEnabled: process.env.PIWIK_ENABLED !== 'false',
      piwikSiteId: process.env.PIWIK_SITE_ID || 1,
    },
    sessionSecret: process.env.SESSION_SECRET || 'change-me'
  },

  api: {
    version: '0.0.0',
    host: APP_HOST,
  },

  apiController: {
    baseUrl: env.API_BASE_URL || `${APP_BASE_URL}/api`,
  },

  authService: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },

  sparkPost: {
    apiKey: process.env.SPARK_POST_API_KEY || 'tb-set',
    defaults: {
      content: {
        reply_to: process.env.EMAIL_DEFAULT_REPLY_TO || 'Release Notes <hello@release-notes.com>',
      },
      options: {
        inline_css: true,
        open_tracking: false,
        click_tracking: false,
      },
    },
  },
};
