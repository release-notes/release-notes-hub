'use strict';

const AbstractController = require('./AbstractController');
const { check, validationResult } = require('express-validator/check');

const createFormErrors = (field, msg) => ({
  [field]: { msg }
});

class OrganizationController extends AbstractController {
  /**
   * @property {OrganizationRepository} organizationRepository
   * @property {AccountRepository} accountRepository
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.organizationRepository = sm.get('organizationRepository', true);
    this.accountRepository = sm.get('accountRepository', true);

    return this;
  }

  async listOrganizationsAction(req, res) {
    this.renderOrganizationListView(req, res, {});
  }

  async renderOrganizationListView(req, res, params) {
    const organizations = await this.organizationRepository.findByMember(
      req.user._id
    );

    res.render('organizations/index', {
      organizations,
      ...params,
    });
  }

  async createOrganizationAction(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void this.renderOrganizationListView(req, res, {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const name = req.body.name;
    const organization = await this.organizationRepository.findOneByName(name);

    if (organization) {
      const errors = createFormErrors('name', 'Organization name is already in use. Please choose another one.');
      return void this.renderOrganizationListView(req, res, { errors });
    }

    await this.createOrganization({ name, owner: req.user });
    this.renderOrganizationListView(req, res);
  }

  async claimUsernameAction(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void this.renderOrganizationListView(req, res, {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const username = req.body.username;
    const [ account, organization ] = await Promise.all([
      this.accountRepository.findOneByUsername(username),
      this.organizationRepository.findOneByName(username),
    ]);

    if (account || organization) {
      return void this.renderOrganizationListView(req, res, {
        errors: createFormErrors('username', `@${username} is already taken.`),
        form: req.body
      });
    }

    await Promise.all([
      this.accountRepository.findByIdAndUpdate(req.user._id, { username }),
      this.createOrganization({ name: username, owner: req.user }),
    ]);

    res.redirect('/organizations');
  }

  createOrganization({ name, owner }) {
    return this.organizationRepository.create({
      name,
      members: [{
        accountId: owner._id,
      }],
    });
  }

  getRoutes() {
    const authService = this.authService;

    return {
      '/organizations': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.listOrganizationsAction(req, res, next)
        ]
      }],
      '/organizations/new': [{
        handler: (req, res) => res.redirect('/organizations')
      }, {
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('name', 'Organization name must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.createOrganizationAction(req, res, next)
        ]
      }],
      '/organizations/claim-username': [{
        handler: (req, res) => res.redirect('/organizations'),
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

module.exports = OrganizationController;
