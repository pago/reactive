# @pago/reactive - An Introduction

To get started with `@pago/reactive`, you will need to configure Babel, TypeScript or any other compiler to use `@pago/reactive` as the `jsxImportSource`.
However, we have prepared a [CodeSandbox](https://codesandbox.io/s/pagoreactive-playground-zx34h) for you so that you can just focus on testing the library,
rather than having to go through setting it up for your environment. When you are ready to integrate it into your setup, you can take a look at the [integration examples](./../examples/).

So please open up [CodeSandbox](https://codesandbox.io/s/pagoreactive-playground-zx34h) to get started with `@pago/reactive`.

## A first look at a Reactive Component

When you open up the [CodeSandbox](https://codesandbox.io/s/pagoreactive-playground-zx34h), you will find yourself looking at the `App.js` with a component similar to this:

```js
export default function App() {
  const count = ref(0);
  effect(() => {
    console.log(`The count is now ${count.current}!`);
  });
  return () => (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <p>Your current count is {count.current}</p>
      <div>
        <button type="button" onClick={() => count.current++}>
          Increment
        </button>
        <button type="button" onClick={() => count.current--}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

We will want to replace that component with a simple standard React Component so that we can work ourselves towards that version. That could look something like this:

```js
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <p>Your current count is {0}</p>
      <div>
        <button type="button" onClick={() => {}}>
          Increment
        </button>
        <button type="button" onClick={() => {}}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

This a regular old React Function Component. The very curious people will recognize that we are still using `@pago/reactive` to render JSX. That's fine, `@pago/reactive` is fully compatible with standard React Components and does not interfere with their execution.

## From React to Reactive

In our first step towards leveraging the power of `@pago/reactive` we want to convert our standard React Component into a Reactive Component.
The one thing we need to do to make that happen is to return a `render` function instead of the JSX.

```js
export default function App() {
  return () => <div className="App">{/* same as before */}</div>;
}
```

This change converts our standard React Component into a Reactive Component. And it already yields a benefit: **Improved performance**.
By converting a React Component into a Reactive Component, we have optimized the rendering of the component in the same way that `React.memo` optimizes your React Components: It will always return the same Virtual DOM tree unless any given property that you are actually using within the `render` function changes.
In many ways this is actually even better than the optimization offered by `React.memo` because it only tracks properties that you are actually using. If somebody passes in a new property that your component doesn't even accept, that will not cause your component to bail out from optimization.

## The four phases of a Reactive Component Lifecycle

The `@pago/reactive` library has been build with Reacts Concurrent Mode in mind and makes it easy for your code to fit into that execution model.
Because of that, a Reactive Component has a well defined Lifecycle that consists of four stages:

1. Creation Phase
2. Render Phase
3. Effects Phase
4. Teardown Phase

Let's look at an example of those phases and where they live in our Reactive Component:

```js
import { effect } from '@pago/reactive';

export default function App() {
  // PHASE 1: Creation Phase
  // Any code placed here will only execute once during the component creation
  effect(onInvalidate => {
      // PHASE 3: Effects Phase
      // An effect will run after the component has been commited (i.e. rendered to DOM nodes).
      // It will also be invoked whenever any tracked state changes (more details later).
      onInvalidate(() => {
          // PHASE 4: Teardown
          // This callback is invoked when the component is unmounted
          // or before the effect is run again due to tracked state changes
      });
  });
  return () => (
      {/* PHASE 2: Render Phase
          Code placed here will run whenever the component is rendered. */}
    <div className="App">
      {/* same as before */}
    </div>
  );
}
```

This clear separation of phases makes it easy to write code that conforms with the fundamental React principle of side-effects free rendering.
It allows a Reactive Component to optimize itself and avoid running unnecessary code. But more importantly, it allows you to write simple and
straightforward code for your component without having to think about a clever combination of `useEffect`, `useRef` and `useState` that might
yield the desired behaviour.

You might be wondering why `effect` passes in an `onInvalidate` function rather than expecting you to return the teardown function like
Reacts `useEffect` does. This way, you can make your effect `async` and leverage `async` / `await` in a straightforward way without requiring
any tricks on your side.

## Tracked State

We have already hinted that properties passed to a Reactive Component are `tracked` and that a change to them will cause the component to render again.
But `@pago/reactive` wouldn't be very useful if that was all it offered. Instead, it offers ways to create your own `tracked` state through the `ref` and the `reactive` functions.

When using the `reactive` function, we can turn any object into a `tracked` object with minimal fuss. Let's look at what that might look like:

```js
export default function App() {
  const state = reactive({
    count: 0,
  });
  return () => (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <p>Your current count is {state.count}</p>
      <div>
        <button type="button" onClick={() => state.count++}>
          Increment
        </button>
        <button type="button" onClick={() => state.count--}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

We can just access the `count` property of the `tracked` object `state`, reading from it and mutating it however we want.
When the user clicks on either the "Increment" or the "Decrement" buttons, we mutate the `state` object, causing the component to be rendered again.

The other type of state is something that has been part of React for a long time: a `ref`. It offers the exact same shape as a `ref` created by `useRef`.
However, its value is `tracked` and changes to it will trigger effects and rendering when and where necessary.

```js
export default function App() {
  const state = reactive({
    count: 0,
  });
  const h1 = ref();
  effect(() => {
    h1.current.style.color = 'blue';
  });
  return () => (
    <div className="App">
      <h1 ref={h1}>Hello CodeSandbox</h1>
      {/* same as before */}
    </div>
  );
}
```

Whenever the `h1` ref changes its current value, the effect will be triggered.
Besides for tracking DOM elements, we can also use `ref` to manage our state if we want to store a single value, rather than a full object.

```js
function createCounter() {
  const count = ref(0);

  return {
    get count() {
      return count.current;
    },
    increment() {
      count.current++;
    },
    decrement() {
      count.current--;
    },
  };
}
```

We could now use this function in any of our Reactive Components and it would just work.

## Beware: Destructuring

When you use destructuring on a `reactive` object, it will loose its reactivity and its values won't be tracked anymore. Thus, you need to first
convert the object into a `RefContainer` by using the `toRefs` functions.

```js
function Timer(props) {
  const { step, delay } = toRefs(props);
  const count = ref(0);
  effect(onInvalidate => {
    const t = setInterval(() => {
      count.current += step.current;
    }, delay.current);
    onInvalidate(() => clearInterval(t));
  });
  return () => <span>Timer: {count.current}</span>;
}
```

## Global Tracked State

When you are building a client side only application without server side rendering, you can deal with your
global state needs by using a global `tracked` state variable.
Both `ref` and `reactive` can be used for creating them and using and mutating them works as expected.

```js
const globalCount = ref(0);

export default function App() {
  return () => (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <p>Your current count is {globalCount.current}</p>
      <div>
        <button type="button" onClick={() => globalCount.current++}>
          Increment
        </button>
        <button type="button" onClick={() => globalCount.current--}>
          Decrement
        </button>
      </div>
    </div>
  );
}
```

Every component that uses `globalCount` will now be kept in sync automatically.

## State Management with React.Context

When Server Side Rendering is a concern for you or you would like to avoid global state for reasons of testability of your code,
you might want to leverage the React.Context API instead. `@pago/reactive` makes it very easy to use React Context for state management
in your application by making it easy to avoid bugs and performance issues.

Let's go back to our `getCounter` function that we've defined previously and let's put an instance of it into a Context so that can be used elsewhere:

```js
import { ref, inject } from '@pago/reactive';
import { createContext } from 'react';
// a fancy counter model
function createCounter() {
  const count = ref(0);

  return {
    get count() {
      return count.current;
    },
    increment() {
      count.current++;
    },
    decrement() {
      count.current--;
    },
  };
}
// creating the React Context to store it
const CounterContext = createContext();

// A provider component that makes the context available
function CounterStateProvider(props) {
  const model = createCounter();
  return () => (
    <CounterContext.Provider value={model}>
      {props.children}
    </CounterContext.Provider>
  );
}

function Counter() {
  const model = inject(CounterContext);
  return () => <span>The current count is {model.count}</span>;
}
```

Because of the Lifecycle Phases of a Reactive Component, the value stored within the context will always be the same, avoiding unnecessary renderings.
However, whenever the state of the model changes, all components and effects using it will be triggered automatically.

To gain access to our Context within a Reactive Component, we use the `inject` function provided by `@pago/reactive` to inject it into our component.

Together with the various utility functions in `@pago/reactive`, such as `derived`, `readonly` or `watchEffect`, you might find less of a need to
reach for libraries like MobX or Recoil in your application.

## Compatibility with Hooks

There are many useful React Hooks out there that you might want to use in your application. Maybe you are not even writing a new one but have to integrate `@pago/reactive` into your current codebase that is full of existing Hooks.
As we've discovered right at the beginning, React and Reactive Components can live next to each other without any problems. But can they interact? Can you leverage existing Hooks? Of course you can!

### Using existing Hooks in Reactive Components

Let's assume that you have a wonderful `useScreenSize` Hook that you would like to use within your Reactive Component.
All you'll need to do is to pass it to `fromHook`:

```js
import { fromHook } from '@pago/reactive';
import { useScreenSize } from 'somewhere';

function ScreenSizePrinter() {
  const screenSize = fromHook(useScreenSize);

  return () => <p>The current screen size is {screenSize.current}</p>;
}
```

`@pago/reactive` will automatically execute the Hook on every rendering of the Reactive Component, giving it a chance to modify
the `screenSize` `ref` value and thus potentially causing a rerendering. You can pass any kind of function to `fromHook` and can
use all existing React Hooks to do its work. It does not have to result in a new value.

```js
function Timer() {
  const timer = fromHook(function useTimer() {
    const [timer, setTimer] = useState(0);
    useEffect(() => {
      const t = setInterval(() => {
        setTimer(current => current + 1);
      }, 1000);
      return () => clearInterval(t);
    }, []);
    return timer;
  });
  return () => <span>Timer: {timer.current}</span>;
}
```

We pass a named function expression `useTimer` to `fromHook` to signal to eslint that we are within a React Hook and that it should apply
all of its usual logic to the function scope. As mentioned before, the function you pass to `fromHook` does not have to return a value.

```js
function Timer() {
  const timer = ref(0);

  fromHook(function useTimer() {
    useEffect(() => {
      const t = setInterval(() => {
        timer.current++;
      }, 1000);
      return () => clearInterval(t);
    }, []);
  });
  return () => <span>Timer: {timer.current}</span>;
}
```

`@pago/reactive` offers another automatic performance improvement over React Components when using Hooks:
In React, when a Hook signals that it needs to be executed again, the entire component will re-render. In a Reactive Component,
all registered Hooks will be triggered but if that doesn't result in an actual change of the state that is `tracked` by
the `render` function, then no rendering will happen and the old Virtual DOM tree will be reused.

### Using tracked ref objects in a Hook

The example above, compared to its previous purely Reactive Component versions, no longer accepts properties to
control the delay or the incrementation step. The function passed to `fromHook` is not tracked by default. Instead,
you are asked to leverage the `useRefValue` Hook to mark a value as tracked within your custom Hook.

```js
import { toRefs, useRefValue } from '@pago/reactive';
import { useEffect, useState } from 'react';

function Timer(props) {
  const { step, delay } = toRefs(props);

  const timer = fromHook(function useTimer() {
    const [timer, setTimer] = useState(0);
    const currentStep = useRefValue(step);
    const currentDelay = useRefValue(delay);
    useEffect(() => {
      const t = setInterval(() => {
        setTimer(current => current + currentStep);
      }, currentDelay);
      return () => clearInterval(t);
    }, [currentStep, currentDelay]);
    return timer;
  });
  return () => <span>Timer: {timer.current}</span>;
}
```

By using `useRefValue` to extract a value from a `ref`, we mark it as read. Thus, any changes to it will cause the component using the Hook to
be invalidated and updated.

The `useRefValue` function can be used in any React Function Component or React Hook
and enables React applications to manage their state through `@pago/reactive`.

## Next Steps

If you've enjoying reading this introduction, please give it a try in [CodeSandbox](https://codesandbox.io/s/pagoreactive-playground-zx34h)
or look through the [examples](../examples) to see how to setup a [Next.js](../examples/nextjs/) project. More examples will follow
over time.

This project is still early on and bugs and issues should be expected. When you encounter anything strange or counter-intuitive, please
open an [report the issue](https://github.com/pago/reactive/issues) on GitHub. That will help us to make the library better and to reach
production quality.

You can also take a look at the [./api/reactive.md](API Documentation) to learn more about the API offered by `@pago/reactive`.
