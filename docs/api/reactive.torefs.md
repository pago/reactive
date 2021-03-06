<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@pago/reactive](./reactive.md) &gt; [toRefs](./reactive.torefs.md)

## toRefs() function

Converts a tracked object into an object of [Ref](./reactive.ref.md) instances.

<b>Signature:</b>

```typescript
export declare function toRefs<T extends {
    [key: string]: any;
}>(store: Store<T>): RefContainer<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  store | [Store](./reactive.store.md)<!-- -->&lt;T&gt; | A tracked object created through [reactive()](./reactive.reactive.md)<!-- -->. |

<b>Returns:</b>

[RefContainer](./reactive.refcontainer.md)<!-- -->&lt;T&gt;

