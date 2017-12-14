const { readFileSync } = require('fs');

module.exports = function svgEmbed({
  path
}) {
  const cache = new Map();

  return function(iconName) {
    if (!(cache.has(iconName))) {
      let svg = readFileSync(`${path}/${iconName}.svg`);
      svg = svg.slice(svg.indexOf('<svg')).toString();

      cache.set(iconName, svg);

      return svg;
    }

    return cache.get(iconName);
  };
};
