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

  sendReleaseNotesUpdateNotification(releaseNotes, releaseNotesUpdate, callback = () => {}) {
    this.loadReleaseNotesSubscriptions(
      releaseNotes._id,
      (subscriptionLookupErr, subscriptions) => {
        if (subscriptionLookupErr) {
          return void callback(subscriptionLookupErr);
        }

        if (!subscriptions || !subscriptions.length) {
          this.logger.info(`No subscriptions, no update notifications sent for @${releaseNotes.scope}/${releaseNotes.name}`);

          return void callback();
        }

        const emailRecipients = subscriptions.map(subscription => subscription.email);
        const newReleases = this.releaseNotesUpdateService.calculateUpdates(
          releaseNotes, releaseNotesUpdate
        );

        if (!newReleases || !newReleases.length) {
          this.logger.info(`No new releases, no update notifications sent for @${releaseNotes.scope}/${releaseNotes.name}`);

          return void callback();
        }

        this.emailService.compose(
          'release-notes-update', {
            releaseNotes,
            releases: newReleases,
          }, (emailComposeErr, content) => {
            if (emailComposeErr) {
              this.logger.error(
                `Update notification composition error for @${releaseNotes.scope}/${releaseNotes.name}`,
                emailComposeErr
              );

              return void callback(emailComposeErr);
            }

            this.sendEmailNotification(
              { recipients: emailRecipients, content, releaseNotes },
              callback
            );
          }
        );
      }
    )
  }

  sendEmailNotification({ recipients, releaseNotes, content }, callback) {
    this.sparky.sendMessage({
      recipients,
      content: {
        subject: `New version of @${releaseNotes.scope}/${releaseNotes.name} released`,
        from: 'Release Notes <notifications@release-notes.com>',
        text: content.text,
        html: content.html,
      },
    }, (emailTransmissionErr, emailTransmissionResponse) => {
      if (emailTransmissionErr) {
        this.logger.error(
          `Update notification transmission error for @${releaseNotes.scope}/${releaseNotes.name}`,
          emailTransmissionErr
        );

        return void callback(emailTransmissionErr);
      }

      this.logger.info(
        `Update notification transmitted to ${recipients.length} subscribers for @${releaseNotes.scope}/${releaseNotes.name}`,
        emailTransmissionResponse
      );

      callback();
    });
  }

  loadReleaseNotesSubscriptions(id, callback) {
    this.subscriptionRepository.findByReleaseNotesId(
      id,
      (subscriptionLookupErr, subscriptions) => {
        if (subscriptionLookupErr) {
          this.logger.error(
            `Error loading subscriptions of release notes #${id}:`,
            subscriptionLookupErr.message
          );

          return void callback(subscriptionLookupErr);
        }

        callback(null, subscriptions);
      }
    );
  }
}

module.exports = NotificationService;
