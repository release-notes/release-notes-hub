'use strict';

const AbstractController = require('./AbstractController');

class SubscriptionController extends AbstractController {
  /**
   * @property {SubscriptionRepository} subscriptionRepository
   * @property {ReleaseNotesRepository} releaseNotesRepository
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

  renderSubscribeToRealeaseNotesView(req, res, next) {
    const scope = req.params.scope;

    this.loadReleaseNotes(
      scope,
      req.params.releaseNotesId,
      (err, releaseNotesModel) => {
        if (err) {
          return void next(err);
        }

        // not found
        if (!releaseNotesModel) {
          return void next();
        }

        res.render('subscriptions/subscribe', {
          releaseNotesModel,
          scope,
        });
      }
    );
  }

  subscripeToRealeaseNotes(req, res, next) {
    const scope = req.params.scope;
    const releaseNotesId = req.params.releaseNotesId;

    this.loadReleaseNotes(
      scope,
      releaseNotesId,
      (lookupErr, releaseNotesModel) => {
        if (lookupErr) return void next(lookupErr);

        // not found
        if (!releaseNotesModel) {
          return void next();
        }

        this.subscriptionRepository.create({
          subscriberId: req.user._id,
          releaseNotesId: releaseNotesModel._id,
        }, (persistencyErr/*, subscription*/) => {
          if (persistencyErr) return void next(persistencyErr);

          res.redirect('/subscriptions');
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

  unsubscribe(req, res, next) {
    const subscriptionId = req.params.subscriptionId;

    this.subscriptionRepository.findById(subscriptionId, (lookUpErr, subscription) => {
      if (lookUpErr) return void next(lookUpErr);
      if (!subscription) return void next();

      this.subscriptionRepository.findByIdAndRemove(subscription._id, (removalErr) => {
        if (removalErr) return void next(removalErr);

        res.redirect('/subscriptions');
      })
    });
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
        ]
      }],
      '/subscriptions/:subscriptionId/unsubscribe': [{
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.unsubscribe(req, res, next)
        ]
      }],
      '/@:scope/:releaseNotesId/subscribe': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderSubscribeToRealeaseNotesView(req, res, next),
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.subscripeToRealeaseNotes(req, res, next),
        ]
      }]
    };
  }
}

module.exports = SubscriptionController;
