'use strict';

const
  RepositoryService = require('kermit-mongoose/RepositoryService'),
  mongoosePaginate = require('mongoose-paginate');

class AbstractRepository extends RepositoryService {
  /**
   * @inheritDoc
   */
  getDefaultServiceConfig() {
    let defaultServiceConfig = super.getDefaultServiceConfig();

    defaultServiceConfig.enableTimestamps = true;
    defaultServiceConfig.enablePaginatedSearch = true;

    return defaultServiceConfig;
  }

  /**
   * @param id
   * @returns {mongoose.Types.ObjectId}
   */
  getObjectId(id) {
    return this.getMongoose().Types.ObjectId(id);
  }

  /**
   * Retrieve all mongoose schema types-
   *
   * @returns {Object}
   */
  getSchemaTypes() {
    return this.getMongoose().Schema.Types;
  }

  /**
   * @returns {Object}
   */
  getSchemaOptions() {
    let options = {};

    if (this.serviceConfig.get('enableTimestamps')) {
      options.timestamps = true;
    }

    return options;
  }

  /**
   * @returns {mongoose.Schema}
   */
  getSchema() {
    if (!this.schema) {
      let serviceConfig = this.serviceConfig;

      this.schema = super.getSchema();

      if (serviceConfig.get('enablePaginatedSearch')) {
        this.schema.plugin(mongoosePaginate);
      }
    }

    return this.schema;
  }


  /**
   * @param params
   * @returns {Promise}
   */
  create(params) {
    return this
      .getModel()
      .create(params);
  }

  /**
   * Find some entities.
   *
   * @param conditions
   * @returns {Promise}
   */
  find(conditions) {
    return this
      .getModel()
      .find(conditions, null, {
        lean: true
      });
  }

  /**
   * @param entityId
   * @returns {Promise}
   */
  findById(entityId) {
    return this
      .getModel()
      .findById(
        this.getObjectId(entityId),
        null,
        { lean: true }
      )
    ;
  }

  /**
   * @param entityId
   * @param properties
   * @param options
   * @returns {Promise}
   */
  findByIdAndUpdate(entityId, properties, options = {}) {
    return this.findOneAndUpdate({ _id: this.getObjectId(entityId) }, properties, options);
  }

  /**
   * @param entityId
   * @returns {Promise}
   */
  findByIdAndRemove(entityId) {
    return this.findOneAndRemove({ _id: this.getObjectId(entityId) });
  }

  /**
   * @param conditions
   * @param properties
   * @param options
   * @returns {Promise}
   */
  findOneAndUpdate(conditions, properties, options = {}) {
    options = Object.assign({
      lean: true,
      'new': true
    }, options);

    return this
      .getModel()
      .findOneAndUpdate(
        conditions,
        properties,
        options
      );
  }

  /**
   * @param conditions
   * @returns {Promise}
   */
  findOneAndRemove(conditions) {
    return this
      .getModel()
      .findOneAndRemove(conditions);
  }

  /**
   * @param query
   * @returns {Promise}
   */
  findOne(query) {
    return this
      .getModel()
      .findOne(query);
  }

  /**
   * @param query
   * @param options
   * @returns {Promise}
   */
  findList(query, options = {}) {
    options = Object.assign({
      lean: true,
      leanWithId: false,
      offset: 0,
      limit: 20
    }, options);

    delete options.page;

    return this
      .getModel()
      .paginate(
        query,
        options
      ).then(result => ({
        items: result.docs || [],
        total: result.total,
        offset: result.offset,
        limit: result.limit
      }));
  }

  /**
   * Remove some entities.
   *
   * @param conditions
   * @returns {Promise}
   */
  remove(conditions) {
    return this
      .getModel()
      .remove(conditions);
  }
}

module.exports = AbstractRepository;
