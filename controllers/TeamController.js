'use strict';

const AbstractController = require('./AbstractController');
const { check, validationResult } = require('express-validator/check');

const createFormErrors = (field, msg) => ({
  [field]: { msg }
});

class TeamController extends AbstractController {
  /**
   * @property {TeamRepository} teamRepository
   * @property {AccountRepository} accountRepository
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.teamRepository = sm.get('teamRepository', true);
    this.accountRepository = sm.get('accountRepository', true);

    return this;
  }

  async listTeamsAction(req, res) {
    this.renderTeamListView(req, res, {});
  }

  async renderTeamListView(req, res, params) {
    const teams = await this.teamRepository.findByMember(
      req.user._id
    );

    teams.forEach(team => {
      team.membership = team.members.find((member) => member.accountId === req.user._id.toString());
    });

    res.render('teams/index', {
      teams,
      ...params,
    });
  }

  async createTeamAction(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void this.renderTeamListView(req, res, {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const name = req.body.name;
    const team = await this.teamRepository.findOneByName(name);

    if (team) {
      const errors = createFormErrors('name', 'Team name is already in use. Please choose another one.');
      return void this.renderTeamListView(req, res, { errors });
    }

    await this.createTeam({ name, owner: req.user });
    this.renderTeamListView(req, res);
  }

  async claimUsernameAction(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void this.renderTeamListView(req, res, {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const username = req.body.username;
    const [ account, team ] = await Promise.all([
      this.accountRepository.findOneByUsername(username),
      this.teamRepository.findOneByName(username),
    ]);

    if (account || team) {
      return void this.renderTeamListView(req, res, {
        errors: createFormErrors('username', `@${username} is already taken.`),
        form: req.body
      });
    }

    await Promise.all([
      this.accountRepository.findByIdAndUpdate(req.user._id, { username }),
      this.createTeam({ name: username, owner: req.user }),
    ]);

    res.redirect('/teams');
  }

  createTeam({ name, owner }) {
    return this.teamRepository.create({
      name,
      members: [{
        accountId: owner._id,
        joinedAt: new Date(),
        role: 'owner',
      }],
    });
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/teams': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.listTeamsAction(req, res, next)
        ]
      }],
      '/teams/new': [{
        handler: (req, res) => res.redirect('/teams')
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('name', 'Team name must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.createTeamAction(req, res, next)
        ]
      }],
      '/teams/claim-username': [{
        handler: (req, res) => res.redirect('/teams'),
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('username', 'Username must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.claimUsernameAction(req, res, next)
        ]
      }],
    };
  }
}

module.exports = TeamController;
