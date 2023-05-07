module.exports = {
  messageIds: Object.freeze({
    invalid: 'invalid',
    emptyString: 'emptyString',
    emptyArray: 'emptyArray',
    nonLiteralOutside: 'nonLiteralOutside',
    nonLiteralInside: 'nonLiteralInside',
    suggested: 'suggested',
    notEnoughArguments: 'notEnoughArguments',
    nonObjectArgument: 'nonObjectArgument',
    tagsPropertyMissing: 'tagsPropertyMissing'
  }),
  defaultAllowedValues: [
    '@smoke',
    '@regression',
    '@slow',
    '@fast',
    '@low',
    '@medium',
    '@high',
    '@critical'
  ],
  taggableMochaBlocks: ['describe', 'context', 'it'],
  mochaSubmethods: ['only', 'skip'],
  lineMatcher: /^\W*(@\w+)/
};
