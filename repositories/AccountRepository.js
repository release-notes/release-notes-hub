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
      passwordHash: String,
      name: String,
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
}

module.exports = AccountRepository;
