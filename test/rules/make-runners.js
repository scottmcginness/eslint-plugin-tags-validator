const { expect } = require('chai');
const { RuleTester, Linter } = require('eslint');

const defaultOptions = { parserOptions: { ecmaVersion: 2022 } };

class ExpectExceptionLinter extends Linter {
  constructor(expectedError) {
    super();
    this.expectedError = expectedError;
  }

  verify(code, config, filename) {
    expect(() => super.verify(code, config, filename)).to.throw(this.expectedError);
    return [];
  }
}

const makeRunners = (ruleName, rule) => {
/**
 * Runs the tests with the given option and code.
 * @param {any} option - The option object to be used as the rule configuration.
 * @param {({ valid?: RuleTester.ValidTestCase[], invalid?: RuleTester.InvalidTestCase[] })} tests - The tests for the given option.
 */
  const run = (option, optionName, tests) => {
    const ruleTester = new RuleTester(defaultOptions);

    ruleTester.run(ruleName, rule, {
      valid: tests.valid?.map((t) => ({
        code: t.code,
        name: t.name,
        only: t.only,
        options: [option]
      })),
      invalid: tests.invalid?.map((t) => ({
        code: t.code,
        name: t.name,
        only: t.only,
        errors: t.errors.map((e) => ({
          column: e.column,
          endColumn: e.endColumn,
          message: e.message ?? e.messages[optionName]
        })),
        options: [option]
      }))
    });
  };

  const runExpectingException = (cases) => {
    cases.forEach(({ name, option, message }) => {
      const linter = new ExpectExceptionLinter(message);
      const ruleTester = new RuleTester(defaultOptions);

      Object.defineProperty(ruleTester, 'linter', { value: linter });

      ruleTester.run(ruleName, rule, {
        valid: [{
          name,
          code: "describe('', { tags: ['@first'] }, function() {})",
          options: [option]
        }],
        invalid: []
      });
    });
  };

  return { run, runExpectingException };
};

module.exports = makeRunners;
