const fs = require('fs');
const { defaultAllowedValues, lineMatcher } = require('./constants');
const memoize = require('./memoize');

/**
 * Reads the markdown file into an array of tags.
 * @param {string} arg - The path to the markdown file, relative to the linted project root.
 */
const readFromMarkdownFile = memoize((/** @type {string} */markdownFile) => fs
  .readFileSync(markdownFile, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.match(lineMatcher)?.[1])
  .filter((line) => line));

module.exports = {
  /**
   * Determines which allowed values are available, and how they were obtained.
   * @param {TV.ESLint.Rule.RuleContext} context - The rule context.
   * @returns {[allowedValues: string[], using: string]}
   */
  readAllowedValues: (context) => {
    /** @type {{ allowedValues?: string[], markdownFile?: string }} */
    const option = context.options[0];

    if (option) {
      if (option.allowedValues) {
        return [option.allowedValues, 'allowed values'];
      } else if (option.markdownFile) {
        return [readFromMarkdownFile(option.markdownFile), 'markdown file'];
      } else {
        throw new Error("Option must be either 'allowedValues' or 'markdownFile'.");
      }
    } else {
      return [defaultAllowedValues, 'default list'];
    }
  }
};
