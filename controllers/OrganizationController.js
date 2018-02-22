'use strict';

const AbstractController = require('./AbstractController');
const { check, validationResult } = require('express-validator/check');

class OrganizationController extends AbstractController {
  /**
   * @property {OrganizationRepository} organizationRepository
   */

  bootstrap() {
    super.bootstrap();

    const sm = this.getServiceManager();

    this.organizationRepository = sm.get('organizationRepository', true);

    return this;
  }

  async renderOrganizationListView(req, res) {
    this.renderOrganizazionListViewWithParams(req, res, {});
  }

  async renderOrganizazionListViewWithParams(req, res, params) {
    const organizations = await this.organizationRepository.findByMember(
      req.user._id
    );

    res.render('organizations/index', {
      organizations,
      ...params,
    });
  }

  async createOrganization(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return void this.renderOrganizazionListViewWithParams(req, res, {
        errors: errors.mapped(),
        form: req.body,
      });
    }

    const name = req.body.name;

    const organization = await this.organizationRepository.findOneByName(name);

    if (organization) {
      return void this.renderOrganizazionListViewWithParams(req, res, {
        errors: {
          name: {
            msg: 'Organization name is already in use. Please choose another one.'
          }
        },
      });
    }

    await this.organizationRepository.create({
      name,
      members: [{
        accountId: req.user._id,
      }],
    });

    this.renderOrganizationListView(req, res);
  }


  getRoutes() {
    const authService = this.authService;

    return {
      '/organizations': [{
        method: 'get',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          (req, res, next) => this.renderOrganizationListView(req, res, next)
        ]
      }],
      '/organizations/new': [{
        method: 'post',
        handler: [
          authService.authenticate('session'),
          authService.requireUser(),
          check('name', 'Organization name must be alphanumeric and may contain dashes.')
            .matches(/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/),
          (req, res, next) => this.createOrganization(req, res, next)
        ]
      }],
    };
  }
}

module.exports = OrganizationController;
