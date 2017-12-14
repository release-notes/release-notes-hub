const DEFAULT_OPTIONS = {
  enabled: true,
  basePath: '/',
  manifestPath: '../public/rev-manifest.json'
};

module.exports = function assetRev({
  enabled = DEFAULT_OPTIONS.enabled,
  basePath = DEFAULT_OPTIONS.basePath,
  manifestPath = DEFAULT_OPTIONS.manifestPath
} = DEFAULT_OPTIONS) {
  const assetMap = require(manifestPath);

  return function(asset) {
    if (!enabled || !(asset in assetMap)) {
      return `${basePath}${asset}`
    }

    return `${basePath}${assetMap[asset]}`
  };
};
