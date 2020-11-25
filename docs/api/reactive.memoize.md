<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@pago/reactive](./reactive.md) &gt; [memoize](./reactive.memoize.md)

## memoize() function

Returns a function that is only executed again if any of its tracked values have changed. The `controller` can be used to establish a notification system and is largely irrelevant to end users of the API.

<b>Signature:</b>

```typescript
export declare function memoize<T>(fn: () => T, controller?: SubscriptionController): () => T;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | () =&gt; T | A memoized function. |
|  controller | [SubscriptionController](./reactive.subscriptioncontroller.md) | A controller that can be used to manage subscribing to tracked values. |

<b>Returns:</b>

() =&gt; T

## Example


```
const person = ref('Preact');
const message = memoize(() => `Hello ${person.current}`);

console.log(message()); // => 'Hello Preact'
console.log(message()); // => 'Hello Preact', but this time the memoized function was not executed at all

```
