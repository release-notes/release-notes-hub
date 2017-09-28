'use strict';

const
  APP_PATH = `${__dirname}/..`;

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

      // controllers
      errorController: `${APP_PATH}/controllers/ErrorController`,
      indexController: `${APP_PATH}/controllers/IndexController`,
      apiPublishController: `${APP_PATH}/controllers/api/PublishController`,
      authController: `${APP_PATH}/controllers/AuthController`,
      releaseNotesController: `${APP_PATH}/controllers/ReleaseNotesController`,
      subscriptionController: `${APP_PATH}/controllers/SubscriptionController`,

      // repositories
      accountRepository: `${APP_PATH}/repositories/AccountRepository`,
      releaseNotesRepository: `${APP_PATH}/repositories/ReleaseNotesRepository`,
      subscriptionRepository: `${APP_PATH}/repositories/SubscriptionRepository`,

      // model services
      accountService: `${APP_PATH}/services/AccountService`,

      // business logic services
      releaseNotesUpdateService: `${APP_PATH}/services/releaseNotes/UpdateService`,
      releaseNotesNotificationService: `${APP_PATH}/services/releaseNotes/NotificationService`,
      emailService: `${APP_PATH}/services/EmailService`,

      // 3rd party
      sparkPost: `${APP_PATH}/services/SparkPostService`,
    }
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
    },
    port: process.env.PORT || '8080',
    controllers: [
      'apiPublishController',
      'authController',
      'releaseNotesController',
      'subscriptionController',
      'indexController',
      'errorController',
    ],
    viewVariables: {},
    sessionSecret: process.env.SESSION_SECRET || 'change-me'
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
