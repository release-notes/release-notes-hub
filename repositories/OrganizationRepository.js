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
        accountId: String,
      }]
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
