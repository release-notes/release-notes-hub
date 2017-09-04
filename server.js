'use strict';

const WebApp = require('./services/WebApp');

const app = new WebApp();

app
  .configure({
    files: [
      `${__dirname}/config/application.js`,
      `${__dirname}/config/application.local.js`,
    ],
  })
  .bootstrap()
  .launch();

module.exports = app;
