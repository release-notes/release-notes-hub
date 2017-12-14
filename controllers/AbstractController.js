"use strict";

const Service = require('kermit/Service');

class AbstractController extends Service {
  constructor(serviceManager) {
    super(serviceManager);

    this.authService = null;
    this.logger = null;
  }

  bootstrap() {
    const sm = this.getServiceManager();

    this.logger = sm.get('logging', true).getLogger();
    this.authService = sm.get('authService', true);

    return this;
  }

  bind(server) {
    const routes = this.getRoutes();

    Object.keys(routes).forEach(url => {
      const routeDefinition = routes[url];

      if (Array.isArray(routeDefinition)) {
        for (let i = 0, l = routeDefinition.length; i < l; ++i) {
          this.listen(server, url, routeDefinition[i]);
        }
      } else {
        this.listen(server, url, routeDefinition);
      }
    });

    return this;
  }

  getRoutes() {
    return {};
  }

  listen(server, url, routeDefinition) {
    const method = (routeDefinition.method || 'get').toLowerCase();

    let handlers;

    if (typeof routeDefinition.handler === 'function') {
      handlers = [routeDefinition.handler];
    } else {
      handlers = routeDefinition.handler;
    }

    server[method](url, ...this.createControllerHardeningGuard(handlers));
  }

  /**
   * Wrap the controller action call within try/catch.
   * Also catching promise errors.
   *
   * @param {function[]} handlers
   * @returns {function[]}
   */
  createControllerHardeningGuard(handlers) {
    return handlers.map(handler =>
      async (req, res, next) => {
        try {
          await handler(req, res, next);
        } catch (err) {
          next(err);
        }
      }
    );
  }
}

module.exports = AbstractController;
