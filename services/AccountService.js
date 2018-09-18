'use strict';

const bcrypt = require('bcryptjs');
const AbstractRepositoryService = require('./AbstractRepositoryService');

class AccountService extends AbstractRepositoryService {
  getDefaultServiceConfig() {
    let config = super.getDefaultServiceConfig();

    config.repository = 'accountRepository';

    return config;
  }

  bootstrap() {
    super.bootstrap();
    this.teamRepository = this.serviceManager.get('teamRepository');

    return this;
  }

  async createAccountWithCredentials({ email, username, password }) {
    const [byEmail, byUsername, byTeam] = await Promise.all([
      this.repository.findOneByEmail(email),
      username ? this.repository.findOneByUsername(username) : false,
      username ? this.teamRepository.findOneByName(username) : false
    ]);

    if (byEmail) {
      throw new Error('Email is already in use.');
    }

    if (byUsername || byTeam) {
      throw new Error('Username is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const accountArgs = {
      email,
      passwordHash,
    };

    if (username) {
      accountArgs.username = username;
    }

    return this.repository.create(accountArgs).then(account => {
      if (account.username) {
        this.teamRepository.create({
          name: username,
          members: [{
            accountId: account._id,
            username: account.username,
            joinedAt: account.createdAt,
            role: 'owner',
          }],
        });
      }

      return account;
    });
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
