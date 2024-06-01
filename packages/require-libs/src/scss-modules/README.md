# scss-modules

A require hook to compile SCSS Modules on the fly

This package hooks into nodes require, so you can import .scss (and .css) files directly from js/ts files without the need for a bundler.
Similar to [CSS Modules](https://github.com/css-modules/css-modules), it also adds scoping (classnames and animation names will receive a hash suffix).

There are a lot of alternative ways to accomplish this kind of task out there, but most require a bundler to be involved. This one works straight out of the box with node/ts-node.

This package uses some code from [css-modules-require-hook](https://github1s.com/css-modules/css-modules-require-hook) and [csjs](https://github.com/rtsao/csjs), but uses [sass](https://github.com/sass/dart-sass) instead of PostCSS under the hood.

All released under a liberal license: [MIT](../../LICENSE)

## What is an SCSS Module

An **SCSS Module** is an SCSS file in which all class names and animation names are scoped locally by default. Learn more in the article [CSS Modules - Welcome to the Future](http://glenmaddern.com/articles/css-modules) by Glen&nbsp;Maddern.

Note that this package is not (yet) 100% compatible to CSS Modules.

## Quick Setup

First install the package:

```
$ npm i scss-modules
```

Somewhere at the top of your entry-point file before any (s)css files are imported, add this line:

```ts
import "scss-modules/preset";
```

See further below for configuration options.

## Global

In some cases, you want to prevent class names or animations from being scoped.
This is how you define them as global:

```scss
.foo:global(.bar) {
  color: red;
}

.foo :global(.bar) {
  color: green;
}

:global(body:not(.bar)) .foo {
  color: blue;
}

@-global-keyframes yolo {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

Output:

```css
.foo_43z43p.bar {
  color: red;
}

.foo_43z43p .bar {
  color: green;
}

body:not(.bar) .foo_43z43p {
  color: blue;
}

@keyframes yolo {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

## Configuration

There are two ways to configure `scss-modules`:

- By calling the setupHook function from your code before any (s)css imports happen.
- Using a `scss-modules.conf.js` at the root of your project

I would recommend the first approach for a TypeScript project, as it's the easiest and safest.

## TypeScript Configuration

First, create a new file:

```ts
// src/scss-modules.ts
import { setupHook } from "scss-modules";

setupHook({
  devMode: true,
});
```

Now, instead of importing `"scss-modules/preset"`, import the above file.

### Using a Configuration File

The preset import comes with a default configuration, which you can override by defining a configuration file in your working directory (or higher up). This is completely optional!

```js
// scss-modules.conf.js

/** @type {import("scss-modules").Options} */
const config = {
  devMode: true,
};

module.exports = config;
```

The type comment helps for type safety if you have `compilerOptions.checkJs` set to true in your `tsconfig.json` and the config file is not ignored by your tsconfig.

## Options

Above we discussed how to configure `scss-modules`. Here are all the options available:

### `devMode`

Helps you to invalidate cache of all `require` calls. Usually used for the development purpose. It also defines the default value for `style` (for compression of the css).

- **Type:** `boolean`
- **Default:** `process.env.NODE_ENV !== "production"`

### `exts`

Attach the require hook to additional file extensions. This will be passed directly to the [pirates](https://github.com/danez/pirates) package. Check `matcher` to further narrow down the files.

- **Type:** `string[]`
- **Default:** `[".css", ".scss"]`

### `generateScopedNames`

Configure how you want scoped names to be applied.

Example for the same behavior as [css-modules-require-hook](https://github1s.com/css-modules/css-modules-require-hook):

```ts
import genericNames from "generic-names";

setupHook({
  generateScopedNames: genericNames("[name]__[local]___[hash:base64:5]", {
    context: process.cwd(),
  }),
});
```

- **Type:** `boolean|ScopedNameGeneratorFactory`
- **Default:** `true`

### `matcher`

Further narrow down which files should be processed. Return true in the callback if you want to process the file. Remove the callback entirely to accept all files. This will be passed directly to the [pirates](https://github.com/danez/pirates) package.

- **Type:** `(path: string) => boolean`
- **Default:** none

### `preprocessCss`

In rare cases you may want to precompile styles, before they will be passed to [sass](https://github.com/sass/dart-sass). You should use **synchronous** transformations, since `require` function is synchronous.

- **Type:** `(code: string, filename: string) => string`
- **Default:** `identity`

### `processCss` function

In rare cases you may want to perform more transformations after scss-modules is done. You should use **synchronous** transformations, since `require` function is synchronous.

- **Type:** `(code: string, filename: string) => string`
- **Default:** `identity`

### `style`

With this you can change the output style of [sass](https://github.com/sass/dart-sass)

- **Type:** `'expanded' | 'compressed'`
- **Default:** `devMode ? "expanded" : "compressed"`

### `transformToken`

Custom token transformation (i.e. to transform keys to camelCase).

- **Type:** `{ transform: TokenTransformer; only?: boolean; }`
  - `transform` is a function taking a string key and returning a transformed string key.
  - If `only` is set to true, the original key will not be available in the exports.
- **Default:** `{ transform: camelCaseTokenTransformer }`
  - The default transforms `kebab-case` and `snake_case` to camelCase

If you need access to the built-in transformer, do it like this:

```ts
import { camelCaseTokenTransformer } from "scss-modules";
```
