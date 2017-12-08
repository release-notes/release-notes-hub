'use strict';

const crypto = require('crypto');
const AbstractRepository = require('./AbstractRepository');

class AuthTokenRepository extends AbstractRepository {
  getDefaultServiceConfig() {
    const serviceConfig = super.getDefaultServiceConfig();

    serviceConfig.accessTokenBytes = 32;

    return serviceConfig;
  }

  getSchemaDefinition() {
    return {
      accountId: {
        type: String,
        index: true,
      },
      token: {
        type: String,
        unique: true,
      },
      description: String
    };
  }

  create({ accountId, description }) {
    const params = {
      accountId, description,
      token: this.generateToken(),
    };

    return super.create(params);
  }

  findOneByToken(token) {
    return this.findOne({
      token: token
    });
  }

  findAllByAccountId(accountId) {
    return this.find({ accountId });
  }

  generateToken() {
    let accessTokenBytes = this.serviceConfig.get('accessTokenBytes');

    return crypto.randomBytes(accessTokenBytes).toString('base64');
  }
}

module.exports = AuthTokenRepository;
