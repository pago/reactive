<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@pago/reactive](./reactive.md) &gt; [derived](./reactive.derived.md)

## derived() function

Returns a [ReadonlyRef](./reactive.readonlyref.md) whose value will always point to the latest result of the given function. The function will only be executed once per set of values.

<b>Signature:</b>

```typescript
export declare function derived<T>(fn: () => T): ReadonlyRef<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | () =&gt; T | A function which returns a derivation of tracked objects or references. |

<b>Returns:</b>

[ReadonlyRef](./reactive.readonlyref.md)<!-- -->&lt;T&gt;

## Example


```js
const name = ref('Preact');
const greet = derived(() => `Hello ${name.current}!`);
console.log(greet.current); // => 'Hello Preact'
name.current = 'React';
console.log(greet.current); // => 'Hello React'

```

