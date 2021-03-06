'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressSession = require('express-session');
const Service = require('kermit/Service');

class ExpressService extends Service {
  constructor(serviceManager) {
    super(serviceManager);

    this.server = null;
  }

  getDefaultServiceConfig() {
    return {
      port: 8080
    };
  }

  getServer() {
    return this.server;
  }

  bootstrap() {
    this.logger = this.getServiceManager().get('logging').getLogger();

    this.server = express();

    return this;
  }

  launch() {
    let port = this.serviceConfig.get('port');

    this.applySettings();
    this.registerGlobalViewVariables();
    this.initializeMiddleware();
    this.registerControllers();

    this.server.listen(
      port, () => {
        this.logger.info(`${this.server.name} listening at ${port}`);

        this.emit('ready');
      }
    );

    return this;
  }

  applySettings() {
    const settings = this.serviceConfig.get('settings', {});

    Object.keys(settings).forEach(key => this.server.set(key, settings[key]));
  }

  registerGlobalViewVariables() {
    const viewVariables = this.serviceConfig.get('viewVariables', {});

    Object.keys(viewVariables).forEach(variable => {
      const viewVar = viewVariables[variable];

      if (typeof viewVar === 'string' && viewVar.indexOf('@require:') === 0) {
        this.server.locals[variable] = require(viewVar.substr(9));
      } else {
        this.server.locals[variable] = viewVar;
      }
    });
  }

  initializeMiddleware() {
    const authService = this.serviceManager.get('authService');

    this.server.use(express.static('public'));
    this.server.use(bodyParser.urlencoded({ extended: false }));
    this.server.use(cookieParser(
      this.serviceConfig.get('sessionSecret')
    ));
    this.server.use(expressSession({
      resave: false,
      saveUninitialized: false,
      secret: this.serviceConfig.get('sessionSecret'),
    }));

    authService.registerMiddleware(this.server);
  }

  registerControllers() {
    this.logger.info('register controllers');

    const sm = this.getServiceManager();
    const controllers = this.serviceConfig.get('controllers', []);

    controllers.forEach(serviceKey => {
      const controller = sm.get(serviceKey, true);

      this.logger.info(`register ${serviceKey}`);

      controller.bind(this.server);
    });
  }
}

module.exports = ExpressService;
