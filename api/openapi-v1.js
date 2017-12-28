module.exports = function({ version }) {
  return {
    swagger: '2.0',
    basePath: '/api/v1',
    info: {
      title: 'A getting started API.',
      version: version
    },
    definitions: {
      Version: {
        type: 'string',
        description: 'Semantic version string. (see http://semver.org)'
      }
    },
    paths: {},
  };
};
