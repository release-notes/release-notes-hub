'use strict';

const AbstractRepository = require('./AbstractRepository');

/**
 * @class OrganizationRepository
 */
class OrganizationRepository extends AbstractRepository {
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
        joinedAt: Date,
        role: {
          type: String,
          enum: ['owner']
        },
      }],
    };
  }

  /**
   * Find an organization by its name.
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

  findByMember(accountId) {
    return this.find({ 'members.accountId': accountId });
  }
}

module.exports = OrganizationRepository;
