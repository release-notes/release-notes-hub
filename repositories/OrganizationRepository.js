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
    };
  }

  /**
   * Find an organization by its name.
   *
   * @param {string} name
   * @return {Promise}
   */
  findOneByUsername(name) {
    return this.findOne({
      name,
    }, null, {
      collation: { locale: 'en', strength: 2 }
    });
  }
}

module.exports = OrganizationRepository;
