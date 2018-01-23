'use strict';

const Service = require('kermit/Service');
const YamlLoader = require('@release-notes/node/lib/ReleaseNotesLoader');
const changelogParser = require('@release-notes/changelog-parser');

const yamlLoader = new YamlLoader();

function loadChangelog(content) {
  return Promise.resolve(changelogParser.parse(content));
}

function loadYaml(content) {
  return new Promise((resolve, reject) => {
    yamlLoader.loadReleaseNotes(content, (err, releaseNotes) => {
      if (err) return reject(err);

      resolve(releaseNotes);
    })
  });
}

class ReleaseNotesLoader extends Service {
  constructor(serviceManager) {
    super(serviceManager);

    this.loaderMap = {
      md: loadChangelog,
      yml: loadYaml,
      json: loadYaml,
    };
  }

  getFileLoader(fileType) {
    const normalizedType = fileType.toLowerCase();
    const loader = this.loaderMap[normalizedType];

    if (!loader) {
      throw new Error(`No loader found for file type: ${fileType}.`);
    }

    return loader;
  }

  load(buffer, fileType) {
    const loader = this.getFileLoader(fileType);

    return loader(buffer.toString());
  }
}

module.exports = ReleaseNotesLoader;
