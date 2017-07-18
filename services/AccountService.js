'use strict';

const async = require('async');
const bcrypt = require('bcryptjs');
const BaseRepositoryService = require('@gfcc/mongo-tenant-repository/BaseRepositoryService');

class AccountService extends BaseRepositoryService {
  getDefaultServiceConfig() {
    let config = super.getDefaultServiceConfig();

    config.repository = 'accountRepository';

    return config;
  }

  createAccountWithCredentials(params, callback) {
    async.waterfall([
      (taskCallback) => {
        async.parallel({
          byEmail: findByEmailCallback => this.repository.findOneByEmail(params.email, findByEmailCallback),
          byUsername: findByUsernameCallback => this.repository.findOneByUsername(params.username, findByUsernameCallback),
        }, (err, results) => {
          if (err) {
            return void callback(err);
          }

          if (results.byEmail) {
            return void callback(new Error('Email is already in use.'));
          }

          if (results.byUsername) {
            return void callback(new Error('Username is already in use.'));
          }

          taskCallback();
        });
      },
      taskCallback => bcrypt.hash(params.password, 10, taskCallback),
      (passwordHash, taskCallback) => {
        const accountArgs = {
          email: params.email,
          passwordHash,
          username: params.username,
        };

        this.repository.create(accountArgs, taskCallback);
      },
    ], callback);

    return this;
  }

  authenticateWithCredentials(params, callback) {
    async.waterfall([
      taskCallback => this.repository.findOneByEmail(params.email, taskCallback),
      (account, taskCallback) => {
        if (!account) {
          return void taskCallback(new Error('Authentication failed for the given credentials.'));
        }

        bcrypt.compare(
          params.password,
          account.passwordHash,
          (err, matched) => taskCallback(err, matched, account)
        );
      },
      (passwordIsValid, account, taskCallback) => {
        if (!passwordIsValid) {
          return void taskCallback(new Error('Authentication failed for the given credentials.'));
        }

        taskCallback(null, account);
      }
    ], (err, account) => callback(err, account));
  }
}

module.exports = AccountService;
