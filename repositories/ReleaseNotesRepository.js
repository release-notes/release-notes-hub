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
}

module.exports = ReleaseNotesRepository;
