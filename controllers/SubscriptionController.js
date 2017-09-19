'use strict';

const AbstractController = require('./AbstractController');

class SubscriptionController extends AbstractController {
  /**
   * @property {SubscriptionRepository} subscriptionRepository
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.subscriptionRepository = sm.get('subscriptionRepository', true);
    this.releaseNotesRepository = sm.get('releaseNotesRepository', true);

    return this;
  }

  renderSubscriptionsView(req, res, next) {
    this.subscriptionRepository.findBySubscriberId(
      req.user._id,
      (lookupErr, subscriptions) => {
        if (lookupErr) return void next(lookupErr);

        res.render('subscriptions/index', {
          subscriptions,
        });
      }
    );
  }

  loadReleaseNotes(scope, name, callback) {
    this.releaseNotesRepository.findOneByScopeAndName(
      scope,
      name,
      callback
    );

    return this;
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/subscriptions': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderSubscriptionsView(req, res, next)
        ],
      }],
    };
  }
}

module.exports = SubscriptionController;
