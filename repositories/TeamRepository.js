'use strict';

const AbstractRepository = require('./AbstractRepository');

/**
 * @class TeamRepository
 */
class TeamRepository extends AbstractRepository {
  /**
   * @inheritDoc
   */
  getSchemaDefinition() {
    return {
      name: {
        type: String,
        index: {
          unique: true,
          partialFilterExpression: {
            name: {
              $type: 'string'
            }
          },
          collation: {
            locale: 'en',
            strength: 2
          },
        }
      },
      members: [{
        _id: false,
        accountId: String,
        username: String,
        joinedAt: Date,
        role: {
          type: String,
          enum: ['owner']
        },
      }],
    };
  }

  /**
   * Find a team by its name.
   *
   * @param {string} name
   * @return {Promise}
   */
  findOneByName(name) {
    return this.findOne({
      name,
    }, null, {
      collation: { locale: 'en', strength: 2 }
    });
  }

  /**
   * @param {string} accountId The account id of user member
   * @param {string} name The team name
   * @return {Promise}
   */
  findOneByAccountIdAndName({accountId, name}) {
    return this.findOne({
        name, 'members.accountId': accountId
      }, null, {
      collation: { locale: 'en', strength: 2 }
    });
  }

  findByMember(accountId) {
    return this.find({ 'members.accountId': accountId });
  }
}

module.exports = TeamRepository;
