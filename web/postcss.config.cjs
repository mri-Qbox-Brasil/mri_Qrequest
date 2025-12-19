const plugins = {};

try {
  // only require tailwindcss if it's installed
  // this prevents Vite from failing when dev deps are not installed
  // (useful for running the app without Tailwind or on CI)
  // eslint-disable-next-line global-require
  plugins['@tailwindcss/postcss'] = require('@tailwindcss/postcss');
} catch (e) {
  // tailwindcss not installed; skip
}

try {
  // eslint-disable-next-line global-require
  plugins.autoprefixer = require('autoprefixer');
} catch (e) {
  // autoprefixer not installed; skip
}

module.exports = { plugins };
