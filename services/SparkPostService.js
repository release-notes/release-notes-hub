'use strict';

const Service = require('kermit/Service');
const SparkPost = require('sparkpost');

class SparkPostService extends Service {
  bootstrap() {
    super.bootstrap();

    this.sparky = new SparkPost(this.serviceConfig.get('apiKey'));
    this.defaultOptions = this.serviceConfig.get('defaults.options') || {};
    this.defaultContent = this.serviceConfig.get('defaults.content') || {};

    return this;
  }

  applyDefaulOptions(options = {}) {
    return Object.assign({}, this.defaultOptions, options);
  }

  applyDefaulContent(content = {}) {
    return Object.assign({}, this.defaultContent, content);
  }

  sendMessage({ options, recipients, content }) {
    return this.sparky.transmissions.send({
      options: this.applyDefaulOptions(options),
      content: this.applyDefaulContent(content),
      recipients: recipients.map(r => ({ address: r, })),
    });
  }
}

module.exports = SparkPostService;
