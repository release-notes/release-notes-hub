'use strict';

const async = require('async');
const Service = require('kermit/Service');
const pug = require('pug');

class EmailService extends Service {
  compose(template, viewVariables) {
    viewVariables = Object.assign({}, {cache: true}, viewVariables);

    return new Promise((resolve, reject) => {
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
      }, (err, results) => {
        if (err) return reject(err);

        return resolve(results);
      });
    });
  }
}

module.exports = EmailService;
