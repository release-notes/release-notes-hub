'use strict';

const AbstractController = require('./AbstractController');
const ReleaseNotesDataModel = require('@release-notes/node/lib/models/ReleaseNotes');
const { check, validationResult } = require('express-validator/check');
const { userHasPublishRights } = require('../core/access-check');
const multer = require('multer');

const uploadHandler = multer();

class ReleaseNotesController extends AbstractController {
  /**
   * @property {SubscriptionRepository} subscriptionRepository
   * @property {ReleaseNotesRepository} releaseNotesRepository
   * @property {TeamRepository} teamRepository
   * @property {UpdateService} updateService
   * @property {NotificationService} notificationService
   * @property {ReleaseNotesLoader} releaseNotesLoader
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.releaseNotesRepository = sm.get('releaseNotesRepository');
    this.teamRepository = sm.get('teamRepository');
    this.subscriptionRepository = sm.get('subscriptionRepository');
    this.notificationService = sm.get('releaseNotesNotificationService');
    this.updateService = sm.get('releaseNotesUpdateService');
    this.releaseNotesLoader = sm.get('releaseNotesLoader');

    return this;
  }

  async renderPublishViewAction(req, res) {
    this.renderPublishView(req, res);
  }

  async renderPublishView(req, res, params = {}) {
    const userId = req.user._id;
    const teams = await this.teamRepository.findByMember(userId);

    res.render('release-notes/publish', { teams, ...params });
  }

  async publishAction(req, res) {
    const file = req.file;

    if (!file) {
      return void this.renderPublishView(req, res, {
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
      return void this.renderPublishView(req, res,{
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const { name, team: teamName } = req.body;

    try {
      const team = await this.teamRepository.findOneByName(teamName);

      if (!userHasPublishRights({ team, user: req.user })) {
        return this.renderPublishView(req, res.status(403), {
          err: new Error(`You are not authorized to publish to @${teamName}`)
        });
      }

      const updatedReleaseNotes = await this.performReleaseNotesUpdate(file, { name, team });

      res.redirect(`/@${teamName}/${updatedReleaseNotes.name}`);
    } catch (err) {
      return this.renderPublishView(req, res.status(400), { err });
    }
  }

  async performReleaseNotesUpdate(file, { releaseNotes, name, team }) {
    const [releaseNotesUpdate, persistedReleaseNotes] = await Promise.all([
      this.loadReleaseNotesFromUpload(file),
      releaseNotes || this.releaseNotesRepository.findOneByScopeAndName(team.name, name)
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
        scope: team.name, name,
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
    const teams = await this.teamRepository.findByMember(req.user._id);
    const releaseNotesList = await this.releaseNotesRepository.findAllByScopes(
      teams.map(o => o.name)
    );

    res.render('release-notes/private-list', { releaseNotesList });
  }

  async editReleaseNotesAction(req, res, next) {
    const { team: teamName, name } = req.params;
    const [releaseNotes, team] = await Promise.all([
      this.releaseNotesRepository.findOneByScopeAndName(teamName, name),
      this.teamRepository.findOneByName(teamName)
    ]);

    if (!releaseNotes) {
      return void next();
    }

    if (!userHasPublishRights({ team, user: req.user })) {
      // @todo display proper error message
      return void next();
    }

    res.render('release-notes/edit', {
      releaseNotes,
      releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
    });
  }

  async updateReleaseNotesAction(req, res, next) {
    const { team: teamName, name } = req.params;
    const [releaseNotes, team] = await Promise.all([
      this.releaseNotesRepository.findOneByScopeAndName(teamName, name),
      this.teamRepository.findOneByName(teamName)
    ]);

    if (!releaseNotes) {
      return void next();
    }

    if (!userHasPublishRights({ team, user: req.user })) {
      // @todo display proper error message
      return void next();
    }

    const viewVariables = {
      releaseNotes,
      releaseNotesDataModel: ReleaseNotesDataModel.fromJSON(releaseNotes),
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
    const { team, releaseNotesName } = req.params;

    const [releaseNotesModel, subscriptions] = await Promise.all([
      this.releaseNotesRepository.findOneByScopeAndName(
        team, releaseNotesName
      ),
      req.user ? this.subscriptionRepository.findBySubscriberAndReleaseNotes({
        releaseNotesName,
        releaseNotesScope: team,
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
    const team = req.params.team;

    const releaseNotesList = await this.releaseNotesRepository.findAllByScope(team);

    res.render('release-notes/list', {
      releaseNotesList,
      scope: team,
    });
  }

  async updateReleaseNotesSettingsAction(req, res, next) {
    const { team: teamName, name } = req.params;
    const [releaseNotes, team] = await Promise.all([
      this.releaseNotesRepository.findOneByScopeAndName(teamName, name),
      this.teamRepository.findOneByName(teamName)
    ]);

    if (!releaseNotes) {
      return void next();
    }

    if (!userHasPublishRights({ team, user: req.user })) {
      // @todo display proper error message
      return void next();
    }

    const releaseNotesUpdate = {
      page: {
        githubRepo: req.body.githubRepo,
        title: req.body.title,
        description: req.body.description,
      }
    };

    await this.releaseNotesRepository.findByIdAndUpdate(
      releaseNotes._id,
      { $set: releaseNotesUpdate}
    );

    res.redirect(`/release-notes/@${teamName}/${name}`);
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/publish': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res) => this.renderPublishViewAction(req, res),
        ]
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          uploadHandler.single('release-notes'),
          check('team', 'Team must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
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
      '/release-notes/@:team/:name': [{
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
      '/release-notes/@:team/:name/settings': [{
        handler: (req, res) => res.redirect(`/release-notes/@${req.params.team}/${req.params.name}`)
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('githubRepo', 'Please provide a valid github repo handle, eg. some-user/repo-name.')
            .optional()
            .matches(/^[a-zA-Z0-9\-]+\/[a-zA-Z0-9-]+$/),
          (req, res, next) => this.updateReleaseNotesSettingsAction(req, res, next)
        ]
      }],
      '/@:team': {
        handler: (req, res, next) => this.renderAccountRealeaseNotesListView(req, res, next),
      },
      '/@:team/:releaseNotesName': {
        handler: (req, res, next) => this.renderRealeaseNotesView(req, res, next),
      }
    }
  };
}

module.exports = ReleaseNotesController;
