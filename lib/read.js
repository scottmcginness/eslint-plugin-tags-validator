const fs = require('fs');
const { defaultAllowedValues, lineMatcher } = require('./constants');
const memoize = require('./memoize');

const prependAtSign = (/** @type {string} */ tag) => (tag.startsWith('@') ? tag : `@${tag}`);

const deduplicate = (/** @type {string[]} */ array) => Array.from(new Set(array));

const deduplicateTrimmedAndPrepended = (/** @type {string[]} */ array) => deduplicate(array.map((a) => prependAtSign(a.trim())));

/**
 * Reads the markdown file into an array of tags.
 * @param {string} arg - The path to the markdown file, relative to the linted project root.
 */
const readFromMarkdownFile = memoize((/** @type {string} */markdownFile) => deduplicate(fs
  .readFileSync(markdownFile, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.match(lineMatcher)?.[1])
  .filter((line) => line)));

const readPackageFile = () => {
  try {
    return JSON.parse(fs.readFileSync('package.json', 'utf8'));
  } catch (e) {
    throw new Error('Could not read package.json file for tag values.');
  }
};

/**
 * Reads the given property from the package.json file, into an array of tags.
 * @param {string} propertyName - The name of the property in the package.json file.
 */
const readFromPackageJson = memoize((/** @type {string} */ propertyName) => {
  const packageJson = readPackageFile();
  const tags = packageJson[propertyName];

  if (!tags) {
    throw new Error(`Did not find property '${propertyName}' in package.json file.`);
  }

  if (Array.isArray(tags)) {
    return deduplicateTrimmedAndPrepended(tags);
  }

  if (typeof tags === 'object') {
    return deduplicateTrimmedAndPrepended(Object.values(tags).flatMap((g) => (Array.isArray(g) ? g : [])));
  }

  throw new Error(`Property '${propertyName}' in package.json file was neither an array nor an object of arrays.`);
});

module.exports = {
  /**
   * Determines which allowed values are available, and how they were obtained.
   * @param {TV.ESLint.Rule.RuleContext} context - The rule context.
   * @returns {[allowedValues: string[], using: string]}
   */
  readAllowedValues: (context) => {
    /** @type {{ allowedValues?: string[], markdownFile?: string, packageJson?: string }} */
    const option = context.options[0];

    if (option) {
      if (option.allowedValues) {
        return [deduplicateTrimmedAndPrepended(option.allowedValues), 'allowed values'];
      } else if (option.markdownFile) {
        return [readFromMarkdownFile(option.markdownFile), 'markdown file'];
      } else if (option.packageJson) {
        return [readFromPackageJson(option.packageJson), `package '${option.packageJson}'`];
      } else {
        throw new Error("Option must be either 'allowedValues', 'markdownFile' or 'packageJson'.");
      }
    } else {
      return [defaultAllowedValues, 'default list'];
    }
  }
};
