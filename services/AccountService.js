'use strict';

const bcrypt = require('bcryptjs');
const AbstractRepositoryService = require('./AbstractRepositoryService');

class AccountService extends AbstractRepositoryService {
  getDefaultServiceConfig() {
    let config = super.getDefaultServiceConfig();

    config.repository = 'accountRepository';

    return config;
  }

  async createAccountWithCredentials({ email, username, password }) {
    const [byEmail, byUsername] = await Promise.all([
      this.repository.findOneByEmail(email),
      username ? this.repository.findOneByUsername(username) : false,
    ]);

    if (byEmail) {
      throw new Error('Email is already in use.');
    }

    if (byUsername) {
      throw new Error('Username is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const accountArgs = {
      email,
      passwordHash,
      username,
    };

    return this.repository.create(accountArgs);
  }

  async authenticateWithCredentials({ email, password }) {
    const account = await this.repository.findOneByEmail(email);

    if (!account) {
      throw new Error('Authentication failed for the given credentials.');
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      account.passwordHash
    );

    if (!passwordIsValid) {
      throw new Error('Authentication failed for the given credentials.');
    }

    return account;
  }
}

module.exports = AccountService;
