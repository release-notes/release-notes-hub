'use strict';

const BaseRepository = require('@gfcc/mongo-tenant-repository/BaseRepository');

class SubscriptionRepository extends BaseRepository {
  getSchemaDefinition() {
    return {
      subscriberId: {
        type: String,
        required: true,
        index: true,
      },
      releaseNotesId: {
        type: String,
        required: true,
        index: true,
      }
    };
  }
}

module.exports = SubscriptionRepository;
