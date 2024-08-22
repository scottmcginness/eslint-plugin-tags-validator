// @ts-check
const { readAllowedValues } = require('../lib/read');
const memoize = require('../lib/memoize');
const { messageIds } = require('../lib/constants');
const { isTagsProperty, isIrrelevant } = require('../lib/tree');

/** @type {((options: { words: string[] }) => (str: string) => string)} */
const autocorrectCreator = memoize(require('autocorrect'));

/**
 * Determines whether computed values are allowed for tags.
 * @param {TV.ESLint.Rule.RuleContext} context - The current context.
 * @returns True if the 'allowComputed' flag is set to true, otherwise false.
 */
const shouldAllowComputed = (context) => context?.options?.[0]?.allowComputed;

/**
 * Reports on a single invalid tag, which must be a string in the stored tag set.
 * @param {TV.ESTree.Expression | TV.ESTree.Pattern | TV.ESTree.SpreadElement} node - The node at the current value of the tags property.
 * @param {TV.ESLint.Rule.RuleContext} context - The current context.
 * @param {string} using - A string describing which tag set we are using.
 * @param {((str: string) => string) | RegExp} autocorrectOrPattern
 * @param {boolean} isPattern - Indicates that the allowed values are configured as a RegExp.
 * @param {boolean} insideArray
 */
const reportSingleTag = (node, context, using, autocorrectOrPattern, isPattern, insideArray) => {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    if (node.value === '') {
      context.report({
        node,
        messageId: messageIds.emptyString
      });
    } else if (isPattern) {
      const pattern = /** @type {RegExp} */(autocorrectOrPattern);

      if (!pattern.test(node.value)) {
        context.report({
          node,
          messageId: messageIds.pattern,
          data: {
            value: node.value,
            using
          }
        });
      }
    } else {
      const autocorrect = /** @type {(str: string) => string} */(autocorrectOrPattern);

      // We have to go through the whole array to check if there is a match.
      // Might as well ask it for the autocorrection at the same time.
      // This will return the same string if they match, so we'll check that immediately after.
      const closest = autocorrect(node.value);

      if (node.value !== closest) {
        context.report({
          node,
          messageId: messageIds.suggested,
          data: {
            value: node.value,
            using,
            closest
          }
        });
      }
    }
  } else if (node.type === 'TemplateLiteral') {
    // TODO: make this an option; to allow template literals.
    // Do nothing. It might be correct, we just can't tell here.
  } else if (!shouldAllowComputed(context)) {
    context.report({
      node,
      messageId: insideArray ? messageIds.nonLiteralInside : messageIds.nonLiteralOutside
    });
  }
};

/**
 * Reports on any invalid tags values, depending on whether we were given a string, array or something else.
 * @param {TV.ESTree.Expression | TV.ESTree.Pattern} node - The node at the current value of the tags property.
 * @param {TV.ESLint.Rule.RuleContext} context - The current context.
 * @param {string} using - A string describing which tag set we are using.
 * @param {((str: string) => string) | RegExp} autocorrectOrPattern
 * @param {boolean} isPattern - Indicates that the allowed values are configured as a RegExp.
 */
const reportTagsValue = (node, context, using, autocorrectOrPattern, isPattern) => {
  if (node.type === 'Literal') {
    reportSingleTag(node, context, using, autocorrectOrPattern, isPattern, false);
  } else if (node.type === 'ArrayExpression') {
    if (node.elements.length === 0) {
      context.report({ node, messageId: messageIds.emptyArray });
    } else {
      node.elements.forEach((e) => {
        reportSingleTag(e, context, using, autocorrectOrPattern, isPattern, true);
      });
    }
  } else if (node.type === 'TemplateLiteral') {
    // TODO: make this an option; to allow template literals.
    // Do nothing. It might be correct, we just can't tell here.
  } else if (!shouldAllowComputed(context)) {
    context.report({ node, messageId: messageIds.nonLiteralOutside });
  }
};

/** @type {TV.ESLint.Rule.RuleModule} */
const mustMatch = {
  meta: {
    type: 'problem',
    messages: {
      [messageIds.invalid]: 'Invalid tag',
      [messageIds.emptyArray]: 'Invalid tags; must not be empty',
      [messageIds.emptyString]: 'Invalid tag; must not be empty',
      [messageIds.nonLiteralOutside]: 'Invalid tags; must be a literal string or an array of strings',
      [messageIds.nonLiteralInside]: 'Invalid tag; must be a literal string',
      [messageIds.suggested]: "Invalid tag '{{value}}' (using {{using}}). Did you mean '{{closest}}'?",
      [messageIds.pattern]: "Invalid tag '{{value}}' (using {{using}})."
    },
    docs: {
      description: 'Enforce that the Mocha test blocks have tags from the correct set',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [
      {
        anyOf: [
          {
            type: 'object',
            properties: {
              allowedValues: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              allowComputed: {
                type: 'boolean'
              }
            },
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              markdownFile: {
                type: 'string'
              },
              allowComputed: {
                type: 'boolean'
              }
            },
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              packageJson: {
                type: 'string'
              },
              allowComputed: {
                type: 'boolean'
              }
            },
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              pattern: {
                type: 'string'
              },
              allowComputed: {
                type: 'boolean'
              }
            },
            additionalProperties: false
          }
        ]
      }
    ]
  },
  create(context) {
    const [allowedValues, using] = readAllowedValues(context);

    let isPattern;
    let autocorrect = null;
    let pattern = null;

    if (Array.isArray(allowedValues)) {
      if (allowedValues.length === 0) {
        throw new Error(`At least one tag must be allowed; found none (using ${using}).`);
      }

      autocorrect = autocorrectCreator({ words: allowedValues });
      isPattern = false;
    } else {
      pattern = allowedValues;
      isPattern = true;
    }

    return {
      CallExpression(node) {
        if (isIrrelevant(node, 3)) {
          return;
        }

        const arg = node.arguments[1];

        if (arg.type === 'ObjectExpression') {
          const tagsProperty = arg.properties.find(isTagsProperty);

          if (tagsProperty) {
            if (isPattern) {
              reportTagsValue(tagsProperty.value, context, using, pattern, isPattern);
            } else {
              reportTagsValue(tagsProperty.value, context, using, autocorrect, isPattern);
            }
          }
        }
      }
    };
  }
};

module.exports = mustMatch;
