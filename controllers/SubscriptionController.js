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
    const { team, releaseNotesName } = req.params;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.loadReleaseNotes(
        team,
        releaseNotesName
      ),
      this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        subscriberId: req.user._id,
        releaseNotesScope: team,
        releaseNotesName,
      }),
    ]);

    if (!releaseNotesModel) return void next();

    res.render('subscriptions/subscribe', {
      releaseNotesModel,
      subscriptions,
      scope: team,
    });
  }

  async subscribeToRealeaseNotes(req, res, next) {
    const { team, releaseNotesName } = req.params;

    const releaseNotesModel = await this.loadReleaseNotes(
      team,
      releaseNotesName
    );

    // not found
    if (!releaseNotesModel) {
      return void next();
    }

    await this.subscriptionRepository.create({
      subscriberId: req.user._id,
      email: req.user.email,
      releaseNotesId: releaseNotesModel._id,
      releaseNotesScope: team,
      releaseNotesName: releaseNotesModel.name,
    });

    res.redirect('/subscriptions');
  }

  async renderUnsubscribeFromRealeaseNotesView(req, res, next) {
    const { team, releaseNotesName } = req.params;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.loadReleaseNotes(
        team,
        releaseNotesName
      ),
      this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        subscriberId: req.user._id,
        releaseNotesScope: team,
        releaseNotesName,
      }),
    ]);

    // not found
    if (!releaseNotesModel) return void next();

    res.render('subscriptions/unsubscribe', {
      releaseNotesModel,
      subscriptions,
      scope: team,
    });
  }

  async unsubscribeFromRealeaseNotes(req, res, next) {
    const { team: releaseNotesScope, releaseNotesName } = req.params;

    await this.subscriptionRepository.remove({
      subscriberId: req.user._id,
      releaseNotesScope,
      releaseNotesName,
    });

    res.redirect('/subscriptions');
  }

  loadReleaseNotes(team, name) {
    return this.releaseNotesRepository.findOneByScopeAndName(
      team,
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
      '/@:team/:releaseNotesName/subscribe': [{
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
      '/@:team/:releaseNotesName/unsubscribe': [{
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
