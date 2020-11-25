# No (Svelte-inspired) `readable` store API

## Context

Svelte offers a very interesting `readable` API that could work with this library.
An implementation might look similar to this:

```ts
export function readable<T>(initialValue: T, updater?: Updater<T>) {
  const value = ref(initialValue);
  updater?.((newValue: T) => {
    value.current = newValue;
  });
  return {
    get current() {
      return value.current;
    },
  };
}
```

The idea behind it is that it would provide a readonly way to having changing content. Similar to what an Observable would provide.

One of the major questions, however, is whether this API would be beneficial or whether we should aim for something else.

## Use Cases

### Readonly values

`readable` restricts the API to allow only readonly access and thus allows the creation of a safer API surface.

However, the same can be achieved by using a `ReadonlyRef`. It's trivial to implement and we might provide a conversion function for it out of the box.

```ts
function readonly<T>(ref: Ref<T>): ReadonlyRef<T> {
  return derived(() => ref.current);
}
```

A function like this enables the generic conversion of all types of `Ref` values to readonly variants. It offers a similar developer experience but without introducing new concepts:

```js
function getImportantValue() {
  const v = ref(0);
  effect(onInvalidate => {
    const handle = setTimeout(() => {
      v.current = 42;
    }, 1000);
    onInvalidate(() => clearTimeout(handle));
  });
  return readonly(v);
}
```

### Async Values

We might want to use a `readable` when loading data asynchronous (either once or through polling).

```js
const userId = ref(null);
const user = readable(null, set => {
  effect(async onInvalidate => {
    const controller = new AbortController();
    onInvalidate(() => controller.abort());
    if (userId.current) {
      set(await getCurrentUser(userId.current, controller.signal));
    }
  });
});
```

This usage is problematic for three reasons:

1. The canonical way to deal with async resources in React is to leverage Suspense, not `null` values
2. We need to use a separate `effect` to observe and react to outside values, causing multiple levels of nesting

## Decision

While the `readable` API on its own offers a very nice functionality, it does not add enough to make up for the required learning effort as it does not blend in
well enough with the framework.
