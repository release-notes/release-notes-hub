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

  async renderSubscriptionsView(req, res, next) {
    const subscriptions = await this.subscriptionRepository.findBySubscriberId(
      req.user._id
    );
    res.render('subscriptions/index', {
      subscriptions,
    });
  }

  async renderSubscribeToRealeaseNotesView(req, res, next) {
    const scope = req.params.scope;
    const releaseNotesName = req.params.releaseNotesId;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.loadReleaseNotes(
        scope,
        releaseNotesName
      ),
      this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        subscriberId: req.user._id,
        releaseNotesScope: scope,
        releaseNotesName,
      }),
    ]);

    if (!releaseNotesModel) return void next();

    res.render('subscriptions/subscribe', {
      releaseNotesModel,
      subscriptions,
      scope,
    });
  }

  async subscribeToRealeaseNotes(req, res, next) {
    const scope = req.params.scope;
    const releaseNotesId = req.params.releaseNotesId;

    const releaseNotesModel = await this.loadReleaseNotes(
      scope,
      releaseNotesId
    );

    // not found
    if (!releaseNotesModel) {
      return void next();
    }

    await this.subscriptionRepository.create({
      subscriberId: req.user._id,
      email: req.user.email,
      releaseNotesId: releaseNotesModel._id,
      releaseNotesScope: scope,
      releaseNotesName: releaseNotesModel.name,
    });

    res.redirect('/subscriptions');
  }

  async renderUnsubscribeFromRealeaseNotesView(req, res, next) {
    const scope = req.params.scope;
    const releaseNotesName = req.params.releaseNotesName;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.loadReleaseNotes(
        scope,
        releaseNotesName
      ),
      this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        subscriberId: req.user._id,
        releaseNotesScope: scope,
        releaseNotesName,
      }),
    ]);

    // not found
    if (!releaseNotesModel) return void next();

    res.render('subscriptions/unsubscribe', {
      releaseNotesModel,
      subscriptions,
      scope,
    });
  }

  async unsubscribeFromRealeaseNotes(req, res, next) {
    const releaseNotesScope = req.params.scope;
    const releaseNotesName = req.params.releaseNotesName;

    await this.subscriptionRepository.remove({
      subscriberId: req.user._id,
      releaseNotesScope,
      releaseNotesName,
    });

    res.redirect('/subscriptions');
  }

  loadReleaseNotes(scope, name) {
    return this.releaseNotesRepository.findOneByScopeAndName(
      scope,
      name
    );
  }

  async unsubscribe(req, res, next) {
    const subscriptionId = req.params.subscriptionId;
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) return void next();

    await this.subscriptionRepository.findByIdAndRemove(subscription._id);

    res.redirect('/subscriptions');
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
          (req, res, next) => this.subscribeToRealeaseNotes(req, res, next),
        ]
      }],
      '/@:scope/:releaseNotesName/unsubscribe': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderUnsubscribeFromRealeaseNotesView(req, res, next),
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.unsubscribeFromRealeaseNotes(req, res, next),
        ]
      }],
    };
  }
}

module.exports = SubscriptionController;
