'use strict';

const BaseRepository = require('@gfcc/mongo-tenant-repository/BaseRepository');

/**
 * @class AccountRepository
 */
class AccountRepository extends BaseRepository {
  /**
   * @inheritDoc
   */
  getSchemaDefinition() {
    return {
      email: {
        type: String,
        unique: true,
        required: true
      },
      username: {
        type: String,
        unique: true,
        required: true
      },
      passwordHash: String,
    };
  }

  /**
   * @param email
   * @param callback
   * @returns {AccountRepository}
   */
  findOneByEmail(email, callback) {
    this.findOne({
      email: email,
    }, callback);

    return this;
  }

  /**
   * Find an account by its usernam.
   *
   * @param {string} username
   * @param {function} callback
   * @return {AccountRepository}
   */
  findOneByUsername(username, callback) {
    this.findOne({
      username: username,
    }, callback);

    return this;
  }
}

module.exports = AccountRepository;
