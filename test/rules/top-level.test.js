const proxyquire = require('proxyquire');
const { RuleTester } = require('eslint');
const dedent = require('dedent');

const rule = proxyquire('../../rules/top-level', {
  '../lib/memoize': (/** @type {any} */ func) => func,
  '../lib/read': proxyquire('../../lib/read', {
    './memoize': (/** @type {any} */ func) => func
  })
});

const ruleTester = new RuleTester();

ruleTester.run('top-level', rule, {
  valid: [{
    name: 'Ignores non-Mocha call expressions',
    code: dedent`
      func();
      obj.method();`
  }],
  invalid: []
});

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
    const shift = method.length;

    ruleTester.run('top-level', rule, {
      valid: [{
        name: `Top level ${method} with tags is allowed`,
        code: `${method}('', { tags: [] }, function() {})`
      }, {
        name: `Ignored on nested ${method}`,
        code: `describe('', { tags: [] }, function() { ${method}('', function() {}) })`
      }, {
        name: `Ignored on doubly nested ${method}`,
        code: dedent`
          describe('', { tags: [] }, function() {
            describe('', function() {
              ${method}('', function() {})
            })
          })`
      }, {
        name: 'Ignored on more than 3 arguments',
        code: "describe('', 1, 2, 3, function() {})"
      }],
      invalid: [{
        name: `Top level ${method} requires three arguments (none supplied)`,
        code: `${method}()`,
        errors: [{
          message: 'Top level Mocha method block must have 3 arguments (to supply tags at 2nd argument)',
          column: 1,
          endColumn: 1 + shift
        }]
      }, {
        name: `Top level ${method} requires three arguments (only 1 supplied)`,
        code: `${method}('')`,
        errors: [{
          message: 'Top level Mocha method block must have 3 arguments (to supply tags at 2nd argument)',
          column: 1,
          endColumn: 1 + shift
        }]
      }, {
        name: `Top level ${method} requires three arguments (only 2 supplied)`,
        code: `${method}('', function() {})`,
        errors: [{
          message: 'Top level Mocha method block must have 3 arguments (to supply tags at 2nd argument)',
          column: 1,
          endColumn: 1 + shift
        }]
      }, {
        name: `Top level ${method} requires an object at argument 2`,
        code: `${method}('', [], function() {})`,
        errors: [{
          message: 'Top level Mocha method block must have an object at 2nd argument (to supply tags property)',
          column: 6 + shift,
          endColumn: 8 + shift
        }]
      }, {
        name: `Top level ${method} requires tags property at argument 2`,
        code: `${method}('', {}, function() {})`,
        errors: [{
          message: "Top level Mocha method block must have a property 'tags' at 2nd argument",
          column: 6 + shift,
          endColumn: 8 + shift
        }]
      }]
    });
  });
