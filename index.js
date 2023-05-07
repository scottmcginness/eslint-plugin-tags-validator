const mustMatch = require('./rules/must-match');
const topLevel = require('./rules/top-level');

module.exports = {
  rules: {
    'must-match': mustMatch,
    'top-level': topLevel
  }
};
