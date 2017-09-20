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
      },
      releaseNotesScope: {
        type: String,
        required: true,
        index: true,
      },
      releaseNotesName: {
        type: String,
        required: true,
      }
    };
  }

  /**
   * Lookup all subscriptions of the given subscriber.
   *
   * @param {string} subscriberId
   * @param {function} callback
   * @return {SubscriptionRepository}
   */
  findBySubscriberId(subscriberId, callback) {
    return this.find({
      subscriberId,
    }, callback);
  }
}

module.exports = SubscriptionRepository;
