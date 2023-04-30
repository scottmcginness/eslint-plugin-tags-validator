# ESLint tags validator

Provides an ESLint plugin that validates tags applied to Mocha tests. These tags are primarily the ones that have been defined using [@cypress/grep](https://www.npmjs.com/package/@cypress/grep).

This is useful when you would like to restrict tags to a particular subset:
  * in case a tag is mis-typed and would not then run in your suite;
  * so that existing tags can be re-used, instead of making new ones accidentally.

## Installation

Assuming you have ESLint installed already:

`npm install --save-dev eslint-plugin-tags-validator`

In your `.eslintrc.json` (or similar):

```json
{
	...
  "plugins": [
		...
    "tags-validator"
  ],
  "rules": {
		...
    "tags-validator/must-match": "error"
  }
}
```

## Configurations

There are three modes in which the plugin can run.

### 1. Default

If the set of options is just left empty, then the set of tags is matched against a default list:

`@smoke`, `@regression`,

`@slow`, `@fast`,

`@low`, `@medium`, `@high`, `@critical`

This list is taken from the examples given in @cypress/grep itself.

### 2. Specific allowed values

Your project likely has its own tags. In this case, you can specify these:

```json
{
    "tags-validator/must-match": ["error", { "allowedValues": ["@first", "@second"] }]
}
```

This must be an array of any strings that should be used as tags.

### 3. Taken from a documentation file

If your project has its own tags already documented in a file, then you can pull the tags out of this file. In this case, you can point to the file, relative to the top level of the project:

```json
{
    "tags-validator/must-match": ["error", { "markdownFile": "docs/tags.md" }]
}
```

The plugin looks through this file for lists of tags, in some sensible format. That is, a line starting with whitespace or symbols (like bullets), the `@` sign, any word characters (the *tag*), followed by any amout of space and other characters (which are ignored).

The tag will include the `@` sign in all cases. For example:

```markdown
# Filterable tags

These are the tags to be used in the project:
 - @first
 - @second  -> some comment
   • @third  // some other comment, which will be ignored
   • @fourth
 + @fifth (more commentary)
```

will allow tags `@first`, `@second`, `@third`, etc. throughout the project.

### Common options

Additionally, the plugin can allow computed tag names (which are *not* then validated at all). This is in case some of your tags are not literals:

```json
{
    "tags-validator/must-match": ["error", { ..., "allowComputed": "true" }]
}
```

This is *only* applicable when using either `"allowedValues"` or `"markdownFile"`.

