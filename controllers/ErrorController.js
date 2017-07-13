"use strict";

const AbstractController = require('./AbstractController');

class ErrorController extends AbstractController {
  notFoundAction(req, res, next) {
    this.logger.warn('Unresolvable request: ', req.url);

    let err = new Error('Not Found');
    err.status = 404;

    res.render('error/404', {
      error: this.getErrorViewModel(err)
    });
  }

  errorAction(err, req, res, next) {
    this.logger.error('Unhandled error: ', err);

    err.status = err.status || 500;
    res.status(err.status);

    res.render('error/error', {
      error: this.getErrorViewModel(err)
    });
  }

  getErrorViewModel(err) {
    let viewModel = {
      status: err.status
    };

    if (process.env.NODE_ENV === 'dev') {
      viewModel.message = err.message;
      viewModel.stack = err.stack;
    }

    return viewModel;
  }

  bind(server) {
    server.use((req, res, next) => this.notFoundAction(req, res, next));
    server.use((err, req, res, next) => this.errorAction(err, req, res, next));
  }
}

module.exports = ErrorController;
