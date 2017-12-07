'use strict';

const AbstractRepository = require('./AbstractRepository');

class SubscriptionRepository extends AbstractRepository {
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
      },
      email: {
        type: String,
      },
    };
  }

  /**
   * Lookup all subscriptions of the given subscriber.
   *
   * @param {string} subscriberId
   * @return {Promise}
   */
  findBySubscriberId(subscriberId) {
    return this.find({
      subscriberId,
    });
  }

  /**
   * Lookup all subscriptions of a subscriber on a specific release notes.
   *
   * @param subscriberId
   * @param releaseNotesScope
   * @param releaseNotesName
   * @return {Promise}
   */
  findBySubscriberAndReleaseNotes({ subscriberId, releaseNotesScope, releaseNotesName }) {
    return this.find({
      subscriberId,
      releaseNotesScope,
      releaseNotesName,
    });
  }

  /**
   * Lookup all subscriptions on the given release notes.
   *
   * @param releaseNotesId
   * @return {Promise}
   */
  findByReleaseNotesId(releaseNotesId) {
    return this.find({
      releaseNotesId,
    });
  }
}

module.exports = SubscriptionRepository;
