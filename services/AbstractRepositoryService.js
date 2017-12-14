'use strict';

const
  Service = require('kermit/Service');

class AbstractRepositoryService extends Service {
  constructor(serviceManager) {
    super(serviceManager);

    this.repository = null;
  }

  getDefaultServiceConfig() {
    return {
      repository: null
    };
  }

  bootstrap() {
    if (this.repository === null) {
      let sm = this.getServiceManager();

      this.repository = sm.get(this.serviceConfig.get('repository'), true);
    }

    return this;
  }

  getRepository() {
    return this.repository;
  }
}

module.exports = AbstractRepositoryService;
