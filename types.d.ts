import * as ESLintModule from 'eslint';
import * as ESTreeModule from 'estree';

declare namespace ESTree {
  type Property = ESTreeModule.Property;
  type CallExpression = ESTreeModule.CallExpression;
  type Expression = ESTreeModule.Expression;
  type Pattern = ESTreeModule.Pattern;
  type SpreadElement = ESTreeModule.SpreadElement;
  type Literal = ESTreeModule.Literal;
  type SimpleLiteral = ESTreeModule.SimpleLiteral;
}

declare namespace ESLint {
  namespace Rule {
    type RuleModule  = ESLintModule.Rule.RuleModule;
    type RuleContext = ESLintModule.Rule.RuleContext;
  }
}

export as namespace TV;