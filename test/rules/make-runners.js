const { expect } = require('chai');
const { RuleTester, Linter } = require('eslint');

const defaultOptions = { parserOptions: { ecmaVersion: 2022 } };

/**
 * Represents an ESLint linter, which is used as a utility to verify the error message of an exception that occurs.
 */
class ExpectExceptionLinter extends Linter {
  /**
   * Creates an instance of this special linter, which verifies that an error occurs.
   * @param {string} expectedError - The expected error message.
   */
  constructor(expectedError) {
    super();
    this.expectedError = expectedError;
  }

  // @ts-ignore
  verify(code, config, filename) {
    expect(() => super.verify(code, config, filename)).to.throw(this.expectedError);
    return [];
  }
}

/**
 * Provides a factory for creating two runners, a wrapper around RuleTester and an expected exception runner.
 * @param {string} ruleName - The name of the rule.
 * @param {import('eslint').Rule.RuleModule} rule - The rule definition.
 * @returns {any}
 */
const makeRunners = (ruleName, rule) => {
/**
 * Runs the tests with the given option and code.
 * @param {any} option - The option object to be used as the rule configuration.
 * @param {string} optionName - The given name of the option.
 * @param {({ valid?: RuleTester.ValidTestCase[], invalid?: RuleTester.InvalidTestCase[] })} tests - The tests for the given option.
 */
  const run = (option, optionName, tests) => {
    const ruleTester = new RuleTester(defaultOptions);

    ruleTester.run(ruleName, rule, {
      valid: tests.valid?.map((t) => ({
        code: t.code,
        name: t.name,
        only: t.only,
        options: option ? [option] : []
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
        options: option ? [option] : []
      }))
    });
  };

  /**
   * Runs the lint rule with the given option, expecting it to fail with an exception.
   * @param {({ name: string, option: object, message: string })[]} cases - The test cases expected to fail.
   */
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
