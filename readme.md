# import-jsx ![Build Status](https://github.com/vadimdemedes/import-jsx/workflows/test/badge.svg)

> Import and transpile JSX via [loader hooks](https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#loaders). It doesn't transpile anything besides JSX and caches transpiled sources by default.

## Install

```console
npm install import-jsx
```

## Usage

> **Note**:
> `import-jsx` only works with ES modules.

```sh
node --loader=import-jsx react-example.js
```

**react-example.js**

```jsx
const HelloWorld = () => <h1>Hello world</h1>;
```

## Examples

### React

React is auto-detected by default and `react` will be auto-imported, if it's not already.

```jsx
const HelloWorld = () => <h1>Hello world</h1>;
```

### Preact

If an alternative library is used and exports `createElement`, like Preact, configure `import-jsx` to import it instead of React:

```jsx
/** @jsxImportSource preact */

const HelloWorld = () => <h1>Hello world</h1>;
```

### Any JSX pragma

For libraries not compatible with React's API, but which still support JSX, import it and configure `import-jsx` to use its pragma:

```jsx
/** @jsxRuntime classic */
/** @jsx h */
import h from 'vhtml';

const HelloWorld = () => <h1>Hello world</h1>;
```

### CLI

`import-jsx` can be used to transpile JSX inside CLI entrypoints defined in `bin` section of `package.json` and their imported files.

For example, given this **package.json**:

```json
{
	"name": "my-amazing-cli",
	"bin": "cli.js"
}
```

Insert this hashbang at the beginning of **cli.js**:

```jsx
#!/usr/bin/env NODE_NO_WARNINGS=1 node --loader=import-jsx

const HelloWorld = () => <h1>Hello world</h1>;
```

### Disable cache

`import-jsx` caches transpiled sources by default, so that the same file is transpiled only once.
If that's not a desired behavior, turn off caching by setting `IMPORT_JSX_CACHE=0` or `IMPORT_JSX_CACHE=false` environment variable.

```console
IMPORT_JSX_CACHE=0 node --loader=import-jsx my-code.js
```
