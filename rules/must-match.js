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
 * @param {((str: string) => string)} autocorrect
 * @param {boolean} insideArray
 */
const reportSingleTag = (node, context, using, autocorrect, insideArray) => {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    if (node.value === '') {
      context.report({
        node,
        messageId: messageIds.emptyString
      });
    } else {
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
 * @param {((str: string) => string)} autocorrect
 */
const reportTagsValue = (node, context, using, autocorrect) => {
  if (node.type === 'Literal') {
    reportSingleTag(node, context, using, autocorrect, false);
  } else if (node.type === 'ArrayExpression') {
    if (node.elements.length === 0) {
      context.report({ node, messageId: messageIds.emptyArray });
    } else {
      node.elements.forEach((e) => {
        reportSingleTag(e, context, using, autocorrect, true);
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
      [messageIds.suggested]: "Invalid tag '{{value}}' (using {{using}}). Did you mean '{{closest}}'?"
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
          }
        ]
      }
    ]
  },
  create(context) {
    const [allowedValues, using] = readAllowedValues(context);

    if (allowedValues.length === 0) {
      throw new Error(`At least one tag must be allowed; found none (using ${using}).`);
    }

    const autocorrect = autocorrectCreator({ words: allowedValues });

    return {
      CallExpression(node) {
        if (isIrrelevant(node, 3)) {
          return;
        }

        const arg = node.arguments[1];

        if (arg.type === 'ObjectExpression') {
          const tagsProperty = arg.properties.find(isTagsProperty);

          if (tagsProperty) {
            reportTagsValue(tagsProperty.value, context, using, autocorrect);
          }
        }
      }
    };
  }
};

module.exports = mustMatch;
