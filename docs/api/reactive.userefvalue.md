<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@pago/reactive](./reactive.md) &gt; [useRefValue](./reactive.userefvalue.md)

## useRefValue() function

Returns the current value of a [RefObject](./reactive.refobject.md) and starts to track its value once the component has been mounted.

An update will be scheduled if the value of the reference has changed between the first render of the component and mounting it.

<b>Signature:</b>

```typescript
export declare function useRefValue<T>(ref: RefObject<T>): T;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  ref | [RefObject](./reactive.refobject.md)<!-- -->&lt;T&gt; | A tracked reference object. |

<b>Returns:</b>

T

