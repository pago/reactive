# @pago/reactive

[API Docs](./docs/api/reactive.md) | [CodeSandbox](https://codesandbox.io/s/pagoreactive-playground-zx34h) | [Next.js Example](./examples/nextjs/) | [Examples](./stories)

You are using React or Preact but find yourself frustrated by continuous bugs, errors or ceremony caused by
the Hooks API? You thought you could avoid using a separate state management library like Redux, Recoil or MobX
but started to run into unexpected performance issues with the Context API?

Then this library will eventually be the one for you! A reactive component model on top of React and Preact
with automatic performance optimizations and a simple and predictable API that gets out of your way and supports
you in achieving your goals. Blatantly copied from the fantastic Vue Composition API. But for React / Preact.

Huh? Eventually? Oh yes, this thing is bleeding cutting edge and likely to cause you all kinds of pain right now.
Please don't use this in production. We are looking for feedback and observations from experiments you run.
We fully expect to change major parts of the API in various different ways while we try to find the right set
of primitives and abstractions to have a good balance between power and ease of learning.

If you would like to play around with the library:

- [CodeSandbox Template](https://codesandbox.io/s/pagoreactive-playground-zx34h)
- [Next.js Integration](./examples/nextjs/)

## Project Plan

We are roughly following planning to go through the following steps:

- [x] Make it work
- [ ] Make it good (<-- we are here)
- [ ] Stable release
- [ ] Make it fast
- [ ] Make it small

## Current State of the Project

- [x] Works with Preact & React
- [x] Very little boilerplate on top of React (JS: none, TS: minimal `r`)
- [x] Observable values
- [x] Efficient derived values
- [x] Works with Suspense
- [x] Works with React.Context (through `inject`)
- [x] Concurrent Mode Safe (!) (as far as I can see, Expert review would be great)
- [x] Reuse your existing Hooks in a Reactive Component through `fromHook`
- [x] Reuse `ref` values in Hooks components through `useRefValue`
- [x] Doesn't show any wrapper components in React DevTools
- [x] Perfect for incremental adoption into existing projects (use the pragma comment for per-file adoption)
- [ ] TypeScript: Do we really need `r`? Can we adapt the `JSX.Element['type']` property to include our kind of components?
- [ ] Lifecycle callbacks (do we really need them? All can be replicated in user-land if needed)
- [ ] Rx.js interop? Useful? How do we handle subscriptions?
- [ ] Optimized Preact implementation (by tapping into its plugin API)
- [ ] Documentation
- [ ] Consistent naming of things (so far copied Vue API for a lot of things - do the names match & make sense in this context?)
- [ ] Optimization (Performance & Code Size)

## Examples

### A Counter component

```jsx
/** @jsxImportSource @pago/reactive */
import { ref } from '@pago/reactive';

function Counter(props) {
  const count = ref(0);

  return () => (
    <div>
      <div>Count: {count.current}</div>
      <div>
        <button type="button" onClick={() => (count.current += props.step)}>
          Increment
        </button>
        <button type="button" onClick={() => (count.current -= props.step)}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

### A Timer component

```tsx
/** @jsxImportSource @pago/reactive */
import { r, ref, effect } from '@pago/reactive';

interface Props {
  step: number;
  delay: number;
}

function Timer(props: Props) {
  const count = ref(0);

  effect(onInvalidate => {
    const timer = setInterval(() => {
      // update is needed because we are reading from and writing to count
      count.update(current => current + props.step);
    }, props.delay);

    onInvalidate(() => clearInterval(timer));
  });

  return r(() => (
    <div>
      <div>Count: {count.current}</div>
    </div>
  ));
}
```

## Setup

The easiest way to setup `@pago/reactive` for either React or Preact is to leverage the new `jsxImportSource` option and to set it to `@pago/reactive`.

Requirements:

- React 17 or later
- or Preact (todo: insert correct version)
- Babel (todo: insert correct version)
- or TypeScript (todo: insert correct version)

### Per file

Specifying `@pago/reactive` as the JSX factory can be done using a comment at the beginning of the file. This should be supported by Babel & TypeScript.

```js
/** @jsxImportSource @pago/reactive */
```

### Babel

As specified in [the babel documentation](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx):

```json
{
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "runtime": "automatic",
        "importSource": "@pago/reactive"
      }
    ]
  ]
}
```

## Q & A

### Is this ready for production?

Not yet.

### Why `ref().current` instead of `ref().value`?

Because it allows us to do this:

```jsx
import { ref, effect } from '@pago/reactive';

function CounterComponent() {
  const el = ref();
  effect(function updateDOMManually() {
    el.current.innerHTML = 'Hello World';
  });
  return () => <div ref={el}></div>;
}
```

### Why does TypeScript complain about components not being components?

When you try to use a component like the one below with TypeScript in JSX, it'll inform you that
`() => Element` is not a valid type for a JSX Element.

```tsx
import { ref, effect } from '@pago/reactive';

function CounterComponent() {
  const el = ref();
  effect(function updateDOMManually() {
    el.current.innerHTML = 'Hello World';
  });
  return () => <div ref={el}></div>;
}
```

For the time being we don't have a better solution than to use the provided `r` function, which is basically
a type cast that fakes the right type to make TypeScript happy.

```tsx
import { r, ref, observe } from '@pago/reactive';

function CounterComponent() {
  const el = ref();
  observe(function updateDOMManually() {
    // `observe` is currently invoked immediately, rather than at the next tick
    // not sure if that behaviour is better or worse than delaying it a bit
    if (!el.current) return;
    el.current.innerHTML = 'Hello World';
  });
  return r(() => <div ref={el}></div>);
}
```

An alternative would be to use the `wrap` function explicitly.

```tsx
import { wrap, ref, effect } from '@pago/reactive';
const CounterComponent = wrap(function CounterComponent() {
  const el = ref();
  effect(function updateDOMManually() {
    el.current.innerHTML = 'Hello World';
  });
  return () => <div ref={el}></div>;
});
```
