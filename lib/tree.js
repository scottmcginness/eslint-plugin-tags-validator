const { taggableMochaBlocks, mochaSubmethods } = require('./constants');

/**
 * Determines if the node is a Mocha method, such as `describe(…)`.
 * @param {TV.ESTree.CallExpression} node - The current method call expression.
 * @returns {boolean}
 */
const isMochaMethod = (node) => (
  node.callee.type === 'Identifier'
  && taggableMochaBlocks.includes(node.callee.name));

/**
 * Determines if the node is a Mocha sub-method, such as `describe.only(…)`.
 * @param {TV.ESTree.CallExpression} node - The current method call expression.
 * @returns {boolean}
 */
const isMochaSubmethod = (node) => (
  node.callee.type === 'MemberExpression'
  && node.callee.object.type === 'Identifier'
  && taggableMochaBlocks.includes(node.callee.object.name)
  && node.callee.property.type === 'Identifier'
  && mochaSubmethods.includes(node.callee.property.name));

module.exports = {
  /**
   * Determines whether the given property is the relevant "tags" property.
   * @param {TV.ESTree.Property} p - The property.
   * @returns {p is TV.ESTree.Property}
   */
  isTagsProperty: (p) => (
    p.type === 'Property'
    && p.key.type === 'Identifier'
    && p.key.name === 'tags'),

  /**
   * Determines whether the current expression is a mocha block with exactly three arguments.
   * These are the only nodes that can possibly have tags defined.
   * @param {TV.ESTree.CallExpression} node - The current method call expression.
   * @param {number | null} [expectedArgs] - The number of arguments expected in relevant Mocha function calls.
   * @returns {boolean}
   */
  isIrrelevant: (node, expectedArgs) => (
    (expectedArgs && node.arguments.length !== expectedArgs)
    || (!isMochaMethod(node) && !isMochaSubmethod(node))),

  /**
   * Determines whether the current expression is at the top level of the current file.
   * @param {TV.ESTree.CallExpression & TV.ESLint.Rule.NodeParentExtension} node - The current method call expression.
   * @returns {boolean}
   */
  isTopLevel: (node) => (
    node.parent
    && node.parent.type === 'ExpressionStatement'
    && node.parent.parent
    && node.parent.parent.type === 'Program')
};
