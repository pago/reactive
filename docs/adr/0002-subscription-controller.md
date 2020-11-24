# Subscription Controller

Status: Accepted

## Problem definition
React, especially with Concurrent Mode, enforces a pure, side effect free, rendering behaviour from its components.
This conflicts heavily with our need to subscribe to state changes, caused by calls to `observe` or our actual render function. Both of which need to be executed immediately.

## Solution
We have introduced a `SubscriptionController` class which is used by both `memoize` and `observe` to avoid registration of any observers on their own. Instead, all used `Tag`s are registered with the `SubscriptionController`. However, while they are registered, they are not actually subscribed to.

Instead, we leave control over registration to our `ReactiveComponent`, which registers subscriptions during a `useEffect` callback and thus at a safe point in time when the component has been committed already.

Because the `SubscriptionController` holds a reference to the `Tag` but no the other way around, memory should be freed eventually in case a component is discarded before being committed.

There is a chance an `observe`d effect has gone stale between the time when we initially executed it, and the actual subscription (example: a sibling of a suspended component) being made during the commit phase. Thus, whenever we `subscribe` on a `SubscriptionController`, it will validate whether the effect needs to be run again and, if so, will execute it.

## Summary
- Avoids impure render functions (by avoiding eager subscriptions)