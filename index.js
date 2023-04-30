const mustMatch = require('./rules/must-match');

module.exports = {
  rules: {
    'must-match': mustMatch
    // TODO: 'top-level': for requiring them on top-level describes.
  }
};
