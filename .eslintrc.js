module.exports = {
  $schema: 'https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/eslintrc.json',
  plugins: [
    'node',
    'eslint-plugin',
    'mocha'
  ],
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:eslint-plugin/recommended',
    'plugin:mocha/recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022
  },
  env: {
    node: true,
    es6: true
  },
  rules: {
    'linebreak-style': 'off',
    'max-len': 'off',
    'comma-dangle': ['error', 'never'],
    'no-else-return': 'off',
    'mocha/no-mocha-arrows': 'off'
  }
};
