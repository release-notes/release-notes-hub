'use strict';

const AbstractRepository = require('./AbstractRepository');

class ReleaseNotesRepository extends AbstractRepository {
  getSchemaDefinition() {
    const MixedType = this.getSchemaTypes().Mixed;

    return {
      scope: { type: String, required: true },
      name: { type: String, required: true },

      latestVersion: String,
      latestReleaseDate: Date,

      title: String,
      description: String,
      releases: [{
        version: String,
        date: Date,
        title: String,
        description: String,
        added: [MixedType],
        removed: [MixedType],
        changed: [MixedType],
        improved: [MixedType],
        deprecated: [MixedType],
        fixed: [MixedType],
        secured: [MixedType],
      }]
    };
  }

  applySchemaPlugins(schema) {
    super.applySchemaPlugins(schema);

    schema.index({ scope: 1, name: 1 }, { unique: true });

    return this;
  }

  /**
   * @param scope
   * @param name
   *
   * @return {Promise}
   */
  findOneByScopeAndName(scope, name) {
    return this.findOne({
      scope: scope,
      name: name
    });
  }

  /**
   * @param scope
   * @return {Promise}
   */
  findAllByScope(scope) {
    return this.find({
      scope: scope
    });
  }

  /**
   * @param scopes string[]
   * @return {Promise}
   */
  findAllByScopes(scopes) {
    return this.find({
      scope: { $in: scopes }
    });
  }

  /**
   * Retrieve a list of the nth newest release notes.
   *
   * @param {number} count
   * @return {Promise}
   */
  findNewest(count) {
    return this.findList({}, {
      limit: count,
      sort: {
        createdAt: -1
      }
    }).then(list => list.items);
  }
}

module.exports = ReleaseNotesRepository;
