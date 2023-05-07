const proxyquire = require('proxyquire');
const makeRunners = require('./make-runners');

const rule = proxyquire('../../rules/must-match', {
  '../lib/memoize': (/** @type {any} */ func) => func,
  '../lib/read': proxyquire('../../lib/read', {
    './memoize': (/** @type {any} */ func) => func
  })
});

const { run, runExpectingException } = makeRunners('must-match', rule);

runExpectingException([{
  name: 'Empty array of allowed values should fail with an exception',
  option: { allowedValues: [] },
  message: "Error while loading rule 'must-match': At least one tag must be allowed; found none (using allowed values)."
}, {
  name: 'Missing markdown file should fail with an exception',
  option: { markdownFile: 'doesnt-exist' },
  message: "Error while loading rule 'must-match': ENOENT: no such file or directory, open 'doesnt-exist'"
}, {
  name: 'Empty markdown file should fail with an exception',
  option: { markdownFile: './test/rules/files/empty.md' },
  message: "Error while loading rule 'must-match': At least one tag must be allowed; found none (using markdown file)."
}]);

[{
  name: 'allowedValues',
  singleTag: { allowedValues: ['@first'] },
  multipleTags: { allowedValues: ['@first', '@second'] },
  withComputed: { allowedValues: ['@first'], allowComputed: true }
}, {
  name: 'markdownFile',
  singleTag: { markdownFile: './test/rules/files/single-tag.md' },
  multipleTags: { markdownFile: './test/rules/files/multiple-tags.md' },
  withComputed: { markdownFile: './test/rules/files/single-tag.md', allowComputed: true }
}]
  .forEach((optionSet) => {
    [
      'describe',
      'context',
      'it',
      'describe.only',
      'context.only',
      'it.only',
      'describe.skip',
      'context.skip',
      'it.skip'
    ]
      .forEach((method) => {
        // The number of columns to shift right, depending on which method is linted.
        // In all invalid cases, the lines are drawn exactly under the offending node.
        const shift = method.length;

        run(optionSet.singleTag, optionSet.name, {
          valid: [{
            name: 'Ignored on the standard Mocha calls',
            code: `${method}('', function() {})`
          }, {
            name: 'Ignored on the standard Mocha calls (no arguments)',
            code: `${method}()`
          }, {
            name: 'Ignored on the standard Mocha calls (1 argument)',
            code: `${method}('')`
          }, {
            name: 'Ignored on the standard Mocha calls (many arguments)',
            code: `${method}('', 1, 2, 3, function() {})`
          }, {
            name: 'Ignored when there is no tags property',
            code: `${method}('', {}, function() {})`
          }, {
            name: 'One allowed tag vs single defined tag as a string',
            code: `${method}('', { tags: '@first' }, function() {})`
          }, {
            name: 'One allowed tag vs single defined tag as the only string entry in an array',
            code: `${method}('', { tags: ['@first'] }, function() {})`
          }, {
            name: 'One allowed tag vs any number of defined tags, so long as they duplicate the allowed one',
            code: `${method}('', { tags: ['@first', '@first', '@first'] }, function() {})`
          }, {
            name: 'One allowed tag vs template string is always allowed',
            code: `${method}('', { tags: \`firs${'t'}\` }, function() {})`
          }, {
            name: 'One allowed tag vs array containing a template string is allowed',
            code: `${method}('', { tags: [\`firs${'t'}\`, '@first'] }, function() {})`
          }],
          invalid: [{
            name: 'One allowed tag vs single defined tag which does not match',
            code: `${method}('', { tags: '@another' }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 14 + shift,
              endColumn: 24 + shift
            }]
          }, {
            name: 'One allowed tag vs single defined tag in an array, which does not match',
            code: `${method}('', { tags: ['@another'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 15 + shift,
              endColumn: 25 + shift
            }]
          }, {
            name: 'One allowed tag vs defined tag in an array in the first place, which does not match',
            code: `${method}('', { tags: ['@another', '@first'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 15 + shift,
              endColumn: 25 + shift
            }]
          }, {
            name: 'One allowed tag vs defined tag in an array in the second place, which does not match',
            code: `${method}('', { tags: ['@first', '@another'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 25 + shift,
              endColumn: 35 + shift
            }]
          }, {
            name: 'One allowed tag vs a number of defined tags in an array, some of which do not match',
            code: `${method}('', { tags: ['@bad', '@first', '@another'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@bad' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@bad' (using markdown file). Did you mean '@first'?"
              },
              column: 15 + shift,
              endColumn: 21 + shift
            }, {
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 33 + shift,
              endColumn: 43 + shift
            }]
          }, {
            name: 'Empty defined tags array is not allowed',
            code: `${method}('', { tags: [] }, function() {})`,
            errors: [{
              message: 'Invalid tags; must not be empty',
              column: 14 + shift,
              endColumn: 16 + shift
            }]
          }, {
            name: 'Empty defined tag inside array is not allowed',
            code: `${method}('', { tags: [''] }, function() {})`,
            errors: [{
              message: 'Invalid tag; must not be empty',
              column: 15 + shift,
              endColumn: 17 + shift
            }]
          }, {
            name: 'Some other object as defined tags are not allowed',
            code: `${method}('', { tags: {} }, function() {})`,
            errors: [{
              message: 'Invalid tags; must be a literal string or an array of strings',
              column: 14 + shift,
              endColumn: 16 + shift
            }]
          }, {
            name: 'Some non strings inside the tags array are not allowed',
            code: `${method}('', { tags: [1, {}] }, function() {})`,
            errors: [{
              message: 'Invalid tag; must be a literal string',
              column: 15 + shift,
              endColumn: 16 + shift
            }, {
              message: 'Invalid tag; must be a literal string',
              column: 18 + shift,
              endColumn: 20 + shift
            }]
          }, {
            name: 'Computed tags are not allowed by default',
            code: `${method}('', { tags: tagSource() }, function() {})`,
            errors: [{
              message: 'Invalid tags; must be a literal string or an array of strings',
              column: 14 + shift,
              endColumn: 25 + shift
            }]
          }]
        });

        run(optionSet.multipleTags, optionSet.name, {
          valid: [{
            name: 'Multiple allowed tags vs one defined as a string that matches',
            code: `${method}('', { tags: '@first' }, function() {})`
          }, {
            name: 'Multiple allowed tags vs one defined that matches',
            code: `${method}('', { tags: ['@first'] }, function() {})`
          }, {
            name: 'Multiple allowed tags vs several defined that all match',
            code: `${method}('split', { tags: ['@first', '@first', '@second'] }, function too() {})`
          }, {
            name: 'Multiple allowed tags vs several defined that all match in reverse order',
            code: `${method}('', { tags: ['@second', '@second', '@first'] }, function() {})`
          }],
          invalid: [{
            name: 'Multiple allowed vs single unmatched',
            code: `${method}('', { tags: '@another' }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 14 + shift,
              endColumn: 24 + shift
            }]
          }, {
            name: 'Multiple allowed vs unmatched',
            code: `${method}('', { tags: ['@another'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 15 + shift,
              endColumn: 25 + shift
            }]
          }, {
            name: 'Multiple allowed vs many unmatched',
            code: `${method}('', { tags: ['@another', '@bad', '@worse'] }, function() {})`,
            errors: [{
              messages: {
                allowedValues: "Invalid tag '@another' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@another' (using markdown file). Did you mean '@first'?"
              },
              column: 15 + shift,
              endColumn: 25 + shift
            }, {
              messages: {
                allowedValues: "Invalid tag '@bad' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@bad' (using markdown file). Did you mean '@first'?"
              },
              column: 27 + shift,
              endColumn: 33 + shift
            }, {
              messages: {
                allowedValues: "Invalid tag '@worse' (using allowed values). Did you mean '@first'?",
                markdownFile: "Invalid tag '@worse' (using markdown file). Did you mean '@first'?"
              },
              column: 35 + shift,
              endColumn: 43 + shift
            }]
          }]
        });

        run(optionSet.withComputed, optionSet.name, {
          valid: [{
            name: 'Tag list which is all computed is allowed',
            code: `${method}('', { tags: tagSource() }, function() {})`
          }, {
            name: 'Tag list which has a computed value is allowed',
            code: `${method}('', { tags: ['@first', tagSource()] }, function() {})`
          }],
          invalid: []
        });
      });
  });

run(null, 'default', {
  valid: [{
    name: 'Default vs one defined as a string that matches',
    code: "describe('', { tags: '@fast' }, function() {})"
  }, {
    name: 'Default vs one defined that matches',
    code: "describe('', { tags: ['@fast'] }, function() {})"
  }],
  invalid: [{
    name: 'Default vs single unmatched',
    code: "describe('', { tags: '@another' }, function() {})",
    errors: [{
      message: "Invalid tag '@another' (using default list). Did you mean '@smoke'?",
      column: 22,
      endColumn: 32
    }]
  }]
});
