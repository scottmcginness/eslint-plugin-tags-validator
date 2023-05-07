// @ts-check
const { messageIds } = require('../lib/constants');
const { isIrrelevant, isTagsProperty, isTopLevel } = require('../lib/tree');

/**
 * Reports that the tags property is missing from the given argument, if that is the case.
 * @param {TV.ESLint.Rule.RuleContext} context - The current context.
 * @param {TV.ESTree.SpreadElement | TV.ESTree.Expression} argument - The argument node of the call expression, to be checked for a tags property.
 */
const maybeReportMissingTags = (context, argument) => {
  if (argument.type === 'ObjectExpression') {
    const tagsProperty = argument.properties.find(isTagsProperty);

    // If we *do* have a tags property, go no further. The must-match rule will validate it as necessary.
    if (!tagsProperty) {
      context.report({
        node: argument,
        messageId: messageIds.tagsPropertyMissing
      });
    }
  } else {
    // Only an object is acceptable; anything else doesn't look like a tags definition.
    // TODO: allow computed argument here?
    context.report({
      node: argument,
      messageId: messageIds.nonObjectArgument
    });
  }
};

/** @type {TV.ESLint.Rule.RuleModule} */
const topLevel = {
  meta: {
    type: 'problem',
    messages: {
      [messageIds.notEnoughArguments]: 'Top level Mocha method block must have 3 arguments (to supply tags at 2nd argument)',
      [messageIds.nonObjectArgument]: 'Top level Mocha method block must have an object at 2nd argument (to supply tags property)',
      [messageIds.tagsPropertyMissing]: "Top level Mocha method block must have a property 'tags' at 2nd argument"
    },
    docs: {
      description: 'Enforce that the Mocha describe blocks at the top level have tags',
      category: 'Possible Errors',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      CallExpression(node) {
        if (isIrrelevant(node, null) || !isTopLevel(node)) {
          return;
        }

        if (node.arguments.length < 3) {
          context.report({
            node: node.callee,
            messageId: messageIds.notEnoughArguments
          });
        } else if (node.arguments.length === 3) {
          maybeReportMissingTags(context, node.arguments[1]);
        }
      }
    };
  }
};

module.exports = topLevel;
