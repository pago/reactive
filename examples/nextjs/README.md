# Next.js with `@pago/reactive`

## 1. Install `@pago/reactive` through npm/yarn

```sh
yarn add @pago/reactive
```

## 2. Configure Babel to use `@pago/reactive/jsx-runtime`

Install the plugin:

```sh
yarn add @babel/plugin-transform-react-jsx
```

Then add the `.babelrc` configuration file:

```json
{
  "presets": ["next/babel"],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "throwIfNamespace": false,
        "runtime": "automatic",
        "importSource": "@pago/reactive"
      }
    ]
  ]
}
```

## 3. Custom App

Because Next.js is controlling the components that are mounted and we don't control the initial mounting ourselves, we need to have a top-level component (either `App` or `Document`) that is a standard React component instead of a Reactive Component. From there on, all our components can just be Reactive Components.

In this case we decided to implement an `./pages/_app.js`.

```js
function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default App;
```
