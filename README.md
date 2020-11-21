# @pago/reactive

This is a prototype / an experiment. Using this in production should get you fired.
If you like the idea, then help to make it production ready so everybody can start using it!

## Examples

### A Counter component

```tsx
import { wrap, ref } from '../src';

interface Props {
  step: number;
}

const Counter = wrap(function Counter(props: Props) {
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
});
```

### A Timer component

```tsx
import { wrap, ref, observe } from '@pago/reactive';

interface Props {
  step: number;
  delay: number;
}

const Timer = wrap(function Timer(props: Props) {
  const count = ref(0);

  observe(function incrementEffect() {
    const timer = setInterval(() => {
      // update is needed because we are reading from and writing to count
      count.update(current => current + props.step);
    }, props.delay);

    return () => clearInterval(timer);
  });

  return () => (
    <div>
      <div>Count: {count.current}</div>
    </div>
  );
});
```

## Ideal Preact integration

Preact is currently using the following logic to convert function components into class based components:

```js
// Instantiate the new component
if ('prototype' in newType && newType.prototype.render) {
  newVNode._component = c = new newType(newProps, componentContext); // eslint-disable-line new-cap
} else {
  newVNode._component = c = new Component(newProps, componentContext);
  c.constructor = newType;
  c.render = doRender;
}
```

(Source: https://github.com/preactjs/preact/blob/master/src/diff/index.js#L103)

With `doRender` implemented like so:

```js
/** The `.render()` method for a PFC backing instance. */
function doRender(props, state, context) {
  return this.constructor(props, context);
}
```

(Source: https://github.com/preactjs/preact/blob/master/src/diff/index.js#L523)

If Preacts `options` hooks included one for converting function components to class components, then it would be possible
to implement a version of it that invokes `wrap` on it during the conversion. For example:

```js
// Instantiate the new component
if ('prototype' in newType && newType.prototype.render) {
  newVNode._component = c = new newType(newProps, componentContext); // eslint-disable-line new-cap
} else {
  newVNode._component = c = new Component(newProps, componentContext);
  c.constructor = newType;
  c.render = (options._wrapRender && options._wrapRender(doRender)) || doRender;
}
```

would enable us to implement it as

```js
import { options } from 'preact';
import { wrap } from '@pago/reactive';

options._wrapRender = wrap;
```

## Q & A

### Is this ready for production?

... no.

### Why `ref().current` instead of `ref().value`?

Because it allows us to do this:

```jsx
import { ref, observe } from '@pago/reactive';

function CounterComponent() {
  const el = ref();
  observe(function updateDOMManually() {
    // `observe` is currently invoked immediately, rather than at the next tick
    // not sure if that behaviour is better or worse than delaying it a bit
    if (!el.current) return;
    el.current.innerHTML = 'Hello World';
  });
  return () => <div ref={el}></div>;
}
```
