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

## Better integration

At the moment reactive components have to be wrapped using the `wrap` function. That leads to imperfect code and causes code using `@pago/reactive` to
lack the clarity of native React/Preact function components.
However, there should be some ways to make `@pago/reactive` a first-class solution in both Preact and React.

The difference we're looking for:

Before:

```jsx
import { ref, observe } from '@pago/reactive';

const CounterComponent = wrap(function CounterComponent() {
  const el = ref();
  observe(function updateDOMManually() {
    // `observe` is currently invoked immediately, rather than at the next tick
    // not sure if that behaviour is better or worse than delaying it a bit
    if (!el.current) return;
    el.current.innerHTML = 'Hello World';
  });
  return () => <div ref={el}></div>;
});
```

After:

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

### Ideal Preact integration

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

### Preact: Potential performance impact

Impact on performance needs to be measured. The following code has not been tested yet and needs to be verified first.

```js
import { options } from 'preact';
import { wrap } from '@pago/reactive';

const oldVNode = options.vnode;
const map = new WeakMap();
options.vnode = vnode => {
  if (oldVNode) vnode = oldVNode(vnode);
  const type = vnode.type;
  if (!('prototype' in type && type.prototype.render)) {
    // it's a function component
    if (!map.has(type)) {
      map.set(type, wrap(type));
    }
    vnode.type = map.get(type);
  }
  return vnode;
};
```

### Potential React integration

For React it seems like the only suitable solution would be to use a custom JSX pragma that performs a similar operation to the above before delegating to React.
Performance might be impacted. An alternative could be a very smart Babel plugin that recognizes reactive function components using a logic similar to this:

If a function returns a function and either of them leverage JSX within their bodies, then `wrap` the outer function.

That solution would work for both Preact and React and should avoid any negative performance impact. There is a chance that it might miss function components
that delegate their rendering to an outside function. But that should be incredibly unlikely.

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
