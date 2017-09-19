'use strict';

const AbstractController = require('./AbstractController');

class SubscriptionController extends AbstractController {
  static renderSubscriptionsView(req, res, next) {
    res.render('subscriptions/index');
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/subscriptions': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => SubscriptionController.renderSubscriptionsView(req, res, next)
        ]
      }]
    };
  }
}

module.exports = SubscriptionController;
