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
