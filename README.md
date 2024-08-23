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
  "plugins": [
    "tags-validator"
  ],
  "rules": {
    "tags-validator/must-match": "error",
    "tags-validator/top-level": "error"
  }
}
```

## Configurations

The `top-level` rule, when enabled, will require that tags are defined on the top-level Mocha block in every file. This is usually the beginning `describe`.

The `must-match` rule will then validate that those tags are restricted to a set of known values. There are five modes in which this rule can run:

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

### 3. Pattern values

If your project has a set of tags that you want to match against a pattern, you can specify:

```json
{
    "tags-validator/must-match": ["error", { "pattern": "(fast|slow|low|med|hi)" }]
}
```

This must be either a regular expression or a string that converts to one.

### 4. Taken from the package JSON file

Similar to the `allowedValues` setting, but the values are given in the package JSON file as a particular property:

```json
{
    "tags-validator/must-match": ["error", { "packageJson": "testTags" }]
}
```

with the `package.json` itself:
```json
{
    "testTags": [
        "@fast",
        "@slow",
        "@low",
        "@med",
        "@hi"
    ]
}
```

The name `testTags` here specifies the the property you want to use.
This setting is useful if you would prefer to keep `script` definitions closer to the available tags.

This can be extended to categorize the tags for your own purposes. For example:
```json
{
    "testTags": {
        "speed": [
            "@fast",
            "@slow",
        ],
        "priority": [
            "@low",
            "@med",
            "@hi"
        ]
    }
}
```

But note that only the tags are matched. The categories (`speed` & `priority`) here are ignored for linting.

### 5. Taken from a documentation file

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

#### `allowComputed`
The plugin can allow computed tag names (which are *not* then validated at all). This is in case some of your tags are not literals:

```json
{
    "tags-validator/must-match": ["error", { "allowComputed": true }]
}
```

This is *only* applicable when using either `"allowedValues"` or `"markdownFile"`.

#### `prependAtSign`
The plugin defaults to prepending the `@`-sign in front of any tags defined in `"allowedValues"` or taken from `package.json`.

This is so that you don't have to remember to do this in the rule definition, but the tags in your source still require them.

To prevent (i.e. loosen) this behaviour, use:

```json
{
    "tags-validator/must-match": ["error", { "prependAtSign": false }]
}
```

which will mean any tags you define in your rules should match _exactly_ with the tags in your source.

Note that:
  - `"markdownFile"` will still require the `@`-sign, because of how it matches tags in the first place. So you will get an error if this configuration is applied in this case.
  - `"pattern"` does not allow this configured. This is because it would be surprising to have an `@`-sign added to an already complex regular expression.