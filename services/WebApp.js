"use strict";

const Application = require('kermit/Application');

class WebApp extends Application {
  constructor(serviceManager) {
    super(serviceManager);

    this.logger = null;
  }

  launch() {
    const sm = this.getServiceManager();

    super.launch();

    this.logger = sm.get('logging').getLogger();

    sm
      .get('observer')
      .awaitAll([
        'express',
        'mongoose',
      ], 'ready', (err, observations) => this.onReady(err, observations))
      .awaitAny([
        'express',
        'mongoose',
      ], 'error', (err, observation) => this.onError(err, observation))
    ;

    return this;
  }

  onReady(/*err, observations*/) {
    this.logger.debug('All services are ready.');
  }

  onError(err, observation) {
    if (err) {
      throw new Error(err);
    }

    if (observation.args[0]) {
      throw new Error(observation.args[0]);
    }
  }

}

module.exports = WebApp;
