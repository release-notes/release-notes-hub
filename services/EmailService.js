'use strict';

const async = require('async');
const Service = require('kermit/Service');
const pug = require('pug');

class EmailService extends Service {
  compose(template, viewVariables, callback) {
    viewVariables = Object.assign({}, {cache: true}, viewVariables);

    async.parallel({
      html: (taskCallback) => pug.renderFile(
        `views/emails/${template}/html.pug`,
        viewVariables,
        taskCallback
      ),
      text: (taskCallback) => pug.renderFile(
        `views/emails/${template}/text.pug`,
        viewVariables,
        taskCallback
      ),
    }, callback);
  }
}

module.exports = EmailService;
