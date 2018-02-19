const { readFileSync } = require('fs');
const highlightJs = require('highlight.js');

module.exports = function gist({
  path,
}) {
  const cache = new Map();

  return function(gist) {
    if (!(cache.has(gist))) {
      const sourcePath = `${path}/${gist}`;
      const source = readFileSync(sourcePath).toString();
      const lang = gist.slice(gist.lastIndexOf('.') + 1);
      const markup = highlightJs.highlightAuto(source, [lang]).value;

      cache.set(gist, markup);

      return markup;
    }

    return cache.get(gist);
  };
};
