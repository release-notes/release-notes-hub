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

      // controllers
      errorController: `${APP_PATH}/controllers/ErrorController`,
      indexController: `${APP_PATH}/controllers/IndexController`,
      apiPublishController: `${APP_PATH}/controllers/api/PublishController`,
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
      'indexController',
      'errorController'
    ],
    viewVariables: {}
  },
};
