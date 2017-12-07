'use strict';

const AbstractRepository = require('./AbstractRepository');

/**
 * @class AccountRepository
 */
class AccountRepository extends AbstractRepository {
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
   * @returns {Promise}
   */
  findOneByEmail(email) {
    return this.findOne({
      email: email,
    });
  }

  /**
   * Find an account by its username.
   *
   * @param {string} username
   * @return {Promise}
   */
  findOneByUsername(username) {
    return this.findOne({
      username: username,
    });
  }
}

module.exports = AccountRepository;
