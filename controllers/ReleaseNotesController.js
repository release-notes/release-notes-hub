'use strict';

const AbstractController = require('./AbstractController');
const ReleaseNotesDataModel = require('@release-notes/node/lib/models/ReleaseNotes');
const { check, validationResult } = require('express-validator/check');
const multer = require('multer');

const uploadHandler = multer();

class ReleaseNotesController extends AbstractController {
  /**
   * @property {SubscriptionRepository} subscriptionRepository
   * @property {ReleaseNotesRepository} releaseNotesRepository
   * @property {UpdateService} updateService
   * @property {NotificationService} notificationService
   * @property {ReleaseNotesLoader} releaseNotesLoader
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.releaseNotesRepository = sm.get('releaseNotesRepository');
    this.subscriptionRepository = sm.get('subscriptionRepository');
    this.notificationService = sm.get('releaseNotesNotificationService');
    this.updateService = sm.get('releaseNotesUpdateService');
    this.releaseNotesLoader = sm.get('releaseNotesLoader');

    return this;
  }

  renderPublishView(req, res, next) {
    res.render('release-notes/publish');
  }

  async publishAction(req, res) {
    const scope = req.user.username;

    if (!scope) {
      return void res.render('release-notes/publish');
    }

    const file = req.file;

    if (!file) {
      return void res.render('release-notes/publish', {
        errors: {
          file: {
            msg: 'No release-notes.yml file was uploaded.',
          },
        },
        form: req.body
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void res.render('release-notes/publish', {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const name = req.body.name;

    try {
      const updatedReleaseNotes = await this.performReleaseNotesUpdate(file, {
        scope, name, accountId: req.user._id
      });

      res.redirect(`/@${updatedReleaseNotes.scope}/${updatedReleaseNotes.name}`);
    } catch (err) {
      return res.status(400).render('release-notes/publish', { err });
    }
  }

  async performReleaseNotesUpdate(file, { releaseNotes, scope, name, accountId }) {
    const [releaseNotesUpdate, persistedReleaseNotes] = await Promise.all([
      this.loadReleaseNotesFromUpload(file),
      releaseNotes || this.releaseNotesRepository.findOneByScopeAndName(scope, name)
    ]);

    if (persistedReleaseNotes) {
      this.notificationService.sendReleaseNotesUpdateNotification(persistedReleaseNotes, releaseNotesUpdate);

      return this.updateService.applyUpdate(
        persistedReleaseNotes,
        releaseNotesUpdate
      );
    } else {
      const latestRelease = this.updateService.calculateLastRelease(releaseNotesUpdate);
      const releaseNotesData = {
        ...releaseNotesUpdate.toJSON(),
        scope, name,
        ownerAccountId: accountId,
        latestVersion: latestRelease.version || '',
        latestReleaseDate: latestRelease.date || ''
      };

      return this.releaseNotesRepository.create(releaseNotesData);
    }
  }

  async loadReleaseNotesFromUpload(file) {
    let type = 'yml';
    const extension = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);

    if (file.mimetype === 'text/markdown' || extension === 'md') {
      type = 'md';
    } else if (file.mimetype === 'application/json' || extension === 'json') {
      type = 'json';
    }

    return this.releaseNotesLoader.load(file.buffer, type);
  }

  async renderMyReleaseNotesView(req, res) {
    const releaseNotesList = await this.releaseNotesRepository.findAllByOwnerAccountId(req.user._id);
    res.render('release-notes/private-list', { releaseNotesList });
  }

  async editReleaseNotesAction(req, res, next) {
    const releaseNotes = await this.releaseNotesRepository.findById(req.params.releaseNotesId);

    if (releaseNotes.ownerAccountId !== req.user.id) {
      return void next();
    }

    res.render('release-notes/edit', {
      releaseNotes,
      releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
      releaseNotesId: releaseNotes._id,
    });
  }

  async updateReleaseNotesAction(req, res, next) {
    const releaseNotes = await this.releaseNotesRepository.findById(req.params.releaseNotesId);

    if (releaseNotes.ownerAccountId !== req.user.id) {
      return void next();
    }

    const viewVariables = {
      releaseNotes,
      releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
      releaseNotesId: releaseNotes._id,
    };

    if (!req.file) {
      viewVariables.errors = {file: {msg: 'No release-notes.yml file was uploaded.'}};
      return void res.render('release-notes/edit', viewVariables);
    }

    try {
      const updatedReleaseNotes = await this.performReleaseNotesUpdate(req.file, {
        releaseNotes
      });

      viewVariables.releaseNotesDataModel = ReleaseNotesDataModel.fromJSON(updatedReleaseNotes);

      res.render('release-notes/edit', viewVariables);
    } catch (err) {
      viewVariables.errors = { validation: { msg: err.message } };

      res.status(400).render('release-notes/edit', viewVariables);
    }
  }

  async renderRealeaseNotesView(req, res, next) {
    const params = req.params;
    const releaseNotesName = params.releaseNotesId;
    const releaseNotesScope = params.scope;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.releaseNotesRepository.findOneByScopeAndName(
        releaseNotesScope, releaseNotesName
      ),
      req.user ? this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        releaseNotesName,
        releaseNotesScope,
        subscriberId: req.user._id
      }) : [],
    ]);

    const isSubscribed = subscriptions.length;

    // not found
    if (!releaseNotesModel) return void next();

    res.render('release-notes/detail', {
      releaseNotesModel,
      isSubscribed,
      releaseNotes: ReleaseNotesDataModel.fromJSON(releaseNotesModel),
      releaseNotesName: releaseNotesModel.name,
      scope: releaseNotesModel.scope,
    });
  }

  async renderAccountRealeaseNotesListView(req, res, next) {
    const scope = req.params.scope;

    const releaseNotesList = await this.releaseNotesRepository.findAllByScope(scope);
    res.render('release-notes/list', {
      releaseNotesList,
      scope,
    });
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/publish': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderPublishView(req, res, next)
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          uploadHandler.single('release-notes'),
          check('name', 'Name must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.publishAction(req, res, next)
        ]
      }],
      '/release-notes': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderMyReleaseNotesView(req, res, next)
        ]
      }],
      '/release-notes/:releaseNotesId': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.editReleaseNotesAction(req, res, next)
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          uploadHandler.single('release-notes'),
          (req, res, next) => this.updateReleaseNotesAction(req, res, next)
        ]
      }],
      '/@:scope': {
        handler: (req, res, next) => this.renderAccountRealeaseNotesListView(req, res, next),
      },
      '/@:scope/:releaseNotesId': {
        handler: (req, res, next) => this.renderRealeaseNotesView(req, res, next),
      }
    }
  };
}

module.exports = ReleaseNotesController;
