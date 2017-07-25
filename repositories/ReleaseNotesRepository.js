'use strict';

const BaseRepository = require('@gfcc/mongo-tenant-repository/BaseRepository');

class ReleaseNotesRepository extends BaseRepository {
  getSchemaDefinition() {
    const MixedType = this.getSchemaTypes().Mixed;

    return {
      scope: { type: String, 'default': 'global', required: true },
      name: { type: String, required: true },
      ownerAccountId: String,

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

  findOneByScopeAndName(scope, name, callback) {
    this.findOne({
      scope: scope,
      name: name
    }, callback);

    return this;
  }

  findAllByScope(scope, callback) {
    this.find({
      scope: scope
    }, callback);

    return this;
  }

  /**
   * Retrieve a list of the nth newest release notes.
   *
   * @param {number} count
   * @param {function} callback
   */
  findNewest(count, callback) {
    this.findList({}, {
      limit: count,
      sort: {
        createdAt: -1
      }
    }, (err, releaseNotesList) => {
      if (err) {
        return void callback(err);
      }

      return void callback(null, releaseNotesList.items);
    });
  }
}

module.exports = ReleaseNotesRepository;
