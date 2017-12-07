'use strict';

const Service = require('kermit/Service');

class NotificationService extends Service {
  bootstrap() {
    const sm = this.serviceManager;

    this.subscriptionRepository = sm.get('subscriptionRepository');
    this.releaseNotesUpdateService = sm.get('releaseNotesUpdateService');
    this.emailService = sm.get('emailService');
    this.sparky = sm.get('sparkPost');
    this.logger = sm.get('logging');

    return this;
  }

  async sendReleaseNotesUpdateNotification(releaseNotes, releaseNotesUpdate) {
    const subscriptions = await this.loadReleaseNotesSubscriptions(
      releaseNotes._id
    );

    if (!subscriptions || !subscriptions.length) {
      this.logger.info(`No subscriptions, no update notifications sent for @${releaseNotes.scope}/${releaseNotes.name}`);

      return;
    }

    const emailRecipients = subscriptions.map(subscription => subscription.email);
    const newReleases = this.releaseNotesUpdateService.calculateUpdates(
      releaseNotes, releaseNotesUpdate
    );

    if (!newReleases || !newReleases.length) {
      this.logger.info(`No new releases, no update notifications sent for @${releaseNotes.scope}/${releaseNotes.name}`);

      return;
    }

    try {
      const content = await this.emailService.compose(
        'release-notes-update', {
          releaseNotes,
          releases: newReleases,
        }
      );

      return this.sendEmailNotification(
        { recipients: emailRecipients, content, releaseNotes }
      );
    } catch (emailComposeErr) {
      this.logger.error(
        `Update notification composition error for @${releaseNotes.scope}/${releaseNotes.name}`,
        emailComposeErr
      );

      throw emailComposeErr;
    }
  }

  async sendEmailNotification({ recipients, releaseNotes, content }) {
    try {
      const emailTransmissionResponse = await this.sparky.sendMessage({
        recipients,
        content: {
          subject: `New version of @${releaseNotes.scope}/${releaseNotes.name} released`,
          from: 'Release Notes <notifications@release-notes.com>',
          text: content.text,
          html: content.html,
        },
      });

      this.logger.info(
        `Update notification transmitted to ${recipients.length} subscribers for @${releaseNotes.scope}/${releaseNotes.name}`,
        emailTransmissionResponse
      );
    } catch (emailTransmissionErr) {
      this.logger.error(
        `Update notification transmission error for @${releaseNotes.scope}/${releaseNotes.name}`,
        emailTransmissionErr
      );

      throw emailTransmissionErr;
    }
  }

  async loadReleaseNotesSubscriptions(id) {
    try {
      return await this.subscriptionRepository.findByReleaseNotesId(id);
    } catch (subscriptionLookupErr) {
      this.logger.error(
        `Error loading subscriptions of release notes #${id}:`,
        subscriptionLookupErr.message
      );

      throw subscriptionLookupErr;
    }
  }
}

module.exports = NotificationService;
