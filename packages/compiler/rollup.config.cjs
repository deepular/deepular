const preserveShebang = require('rollup-plugin-preserve-shebang');

module.exports = (config) => ({
  ...config,
  plugins: [preserveShebang(), ...config.plugins],
})
