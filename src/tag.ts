// Based on https://www.pzuraq.com/how-autotracking-works/

type Revision = number;

let CURRENT_REVISION: Revision = 0;

//////////

const REVISION = Symbol('REVISION');

const scheduledTags = new Set<Tag>();
let nextTick: Promise<void> | null = null;
function schedule(tag: Tag) {
  scheduledTags.add(tag);
  if (!nextTick) {
    nextTick = Promise.resolve().then(drainQueue);
  }
}

function drainQueue() {
  nextTick = null;
  const scheduledEffects = new Set<Effect>();
  scheduledTags.forEach(tag => {
    tag.subscriptions.forEach(effect => scheduledEffects.add(effect));
  });
  scheduledTags.clear();
  scheduledEffects.forEach(effect => effect());
}

/**
 * A function that represents a pure side effect with no input and no output.
 * @public
 */
export interface Effect {
  (): void;
}

class Tag {
  [REVISION] = CURRENT_REVISION;
  subscriptions = new Set<Effect>();

  subscribe(effect: Effect) {
    this.subscriptions.add(effect);
  }

  unsubscribe(effect: Effect) {
    this.subscriptions.delete(effect);
  }
}

export function createTag() {
  return new Tag();
}

export { Tag };

//////////

export function dirtyTag(tag: Tag) {
  if (currentComputation && currentComputation.has(tag)) {
    throw new Error('Cannot dirty tag that has been used during a computation');
  }

  tag[REVISION] = ++CURRENT_REVISION;
  if (tag.subscriptions.size > 0) {
    schedule(tag);
  }
}

//////////

let currentComputation: null | Set<Tag> = null;

export function consumeTag(tag: Tag) {
  if (currentComputation !== null) {
    currentComputation.add(tag);
  }
}

function getMax(tags: Tag[]) {
  return Math.max(...tags.map(t => t[REVISION]));
}

/**
 * Manages the subscription to tracked references and objects within a `memoized` function.
 * @public
 */
export class SubscriptionController {
  private tags: Array<Tag> = [];
  private isSubscribed = false;
  private lastRevision: Revision = 0;
  /**
   * The effect that is triggered whenever a tracked value changes after the controller
   * has subscribed to changes.
   */
  effect: Effect;
  /**
   * A cleanup effect that should be executed before the effect is executed again or
   * on unsubscribe.
   */
  cleanup?: Effect;
  /**
   * Creates a new SubscriptionController.
   * @param effect - The effect that should be executed whenever a tracked reference was changed.
   */
  constructor(effect: Effect) {
    this.effect = effect;
  }

  /**
   * @internal
   * @param tags - The new tags
   * @param lastRevision - The last revision of the tags
   */
  setObservedTags(tags: Array<Tag>, lastRevision: Revision) {
    if (this.isSubscribed) {
      this.unsubscribeFromTags();
      this.tags = tags;
      this.subscribeToTags();
    } else {
      this.tags = tags;
    }
    this.lastRevision = lastRevision;
  }

  private subscribeToTags() {
    this.tags.forEach(tag => tag.subscribe(this.effect));
  }
  private unsubscribeFromTags() {
    this.tags.forEach(tag => tag.unsubscribe(this.effect));
  }

  /**
   * Subscribes to the set of tracked references and objects.
   * Once subscribed, the {@link SubscriptionController.effect} will be triggered whenever
   * any of the values change.
   */
  subscribe() {
    if (this.isSubscribed) {
      return;
    }
    this.subscribeToTags();
    this.isSubscribed = true;
    // there is a chance that a tag has been updated in between
    // us starting to observe it and subscribing to it
    // if that is the case, we will trigger the effect on subscription
    // to make sure we're always up to date
    if (getMax(this.tags) > this.lastRevision) {
      // TODO: Architectural Decision needed (or very good documentation)
      // I am not 100% whether it is a good idea to run this synchronously
      // In our Library-usage that would be preferable since `subscribe` is called
      // during `useEffect` and additional scheduling would just cause unnecessary delays
      // but in user-land this might be confusing as all other parts of the library trigger
      // effects async.
      this.effect();
    }
  }

  /**
   * Unsubscribes from all tracked values.
   */
  unsubscribe() {
    if (!this.isSubscribed) {
      return;
    }
    this.unsubscribeFromTags();
    if (this.cleanup) this.cleanup();
    this.isSubscribed = false;
  }
}

/**
 * Returns a function that is only executed again if any of its tracked values have changed.
 * The `controller` can be used to establish a notification system and is largely irrelevant to end users of the API.
 *
 * @example
 * ```
 * const person = ref('Preact');
 * const message = memoize(() => `Hello ${person.current}`);
 *
 * console.log(message()); // => 'Hello Preact'
 * console.log(message()); // => 'Hello Preact', but this time the memoized function was not executed at all
 * ```
 *
 * @param fn - A memoized function.
 * @param controller - A controller that can be used to manage subscribing to tracked values.
 * @public
 */
export function memoize<T>(
  fn: () => T,
  controller?: SubscriptionController
): () => T {
  let lastValue: T | undefined;
  let lastRevision: Revision | undefined;
  let lastTags: Tag[] | undefined;

  return () => {
    if (lastTags && getMax(lastTags) === lastRevision) {
      if (currentComputation && lastTags.length > 0) {
        lastTags.forEach(tag => currentComputation!.add(tag));
      }

      return lastValue as T;
    }

    let previousComputation = currentComputation;
    currentComputation = new Set();

    try {
      lastValue = fn();
    } finally {
      lastTags = Array.from(currentComputation);
      lastRevision = getMax(lastTags);

      if (lastTags.length > 0 && previousComputation) {
        lastTags.forEach(tag => previousComputation!.add(tag));
      }
      if (controller) controller.setObservedTags(lastTags, lastRevision);

      currentComputation = previousComputation;
    }

    return lastValue;
  };
}

let subscriptions: Array<SubscriptionController> | undefined;
export function collectSubscriptions<T>(
  fn: () => T
): Array<SubscriptionController> {
  const oldSubscriptions = subscriptions;
  let subs = (subscriptions = [] as Array<SubscriptionController>);
  try {
    fn();
  } finally {
    subscriptions = oldSubscriptions;
  }
  return subs;
}

/**
 * Executes the given effect immediately and tracks any used values.
 * When any of them change, it will execute the effect again.
 * If a `teardown` function has been registered through the `onInvalidate` param,
 * it will be executed before the effect is executed again, allowing for cleanup.
 *
 * @remarks
 * When using this function within a Reactive Component, make sure to not rely on any custom `teardown` logic.
 *
 * When this function is used within a Reactive Component, the tracking will be bound to the components lifecycle.
 * It is, therefore, save to use and can be considered side effect free (and thus React Concurrent Mode compatible).
 * However, there are circumstances that might cause a custom `teardown` function to not be invoked.
 *
 * For example, if your component has been rendered but not committed (written to the DOM) then React reserves the right to throw it away without
 * invoking any cleanup logic.
 *
 * ```js
 * // DO NOT DO THIS
 * import { watchEffect, ref } from '@pago/reactive';
 * function Surprise(props) {
 *  const message = ref('Wait for it...');
 *  watchEffect(onInvalidate => {
 *    // This timer will never be cleared
 *    // if the component is not unmounted
 *    // or during server side rendering
 *    // You should use `effect` instead
 *    const token = setTimeout(() => {
 *      message.current = 'Hello World!'
 *    }, props.delay); // props.delay is watched
 *    onInvalidate(() => clearTimeout(token));
 *  });
 *  return () => <p>{message.current}</p>
 * }
 * ```
 *
 * @param fn - The effect that should be executed when any of the tracked values change.
 * @public
 */
export function watchEffect(
  fn: (onInvalidate: (teardown: Effect) => void) => void
): Effect {
  const controller = new SubscriptionController(effect);
  function onInvalidate(teardown: Effect) {
    controller.cleanup = () => {
      teardown();
      controller.cleanup = undefined;
    };
  }
  const run = memoize(() => fn(onInvalidate), controller);
  effect();

  if (subscriptions) {
    subscriptions.push(controller);
  } else {
    controller.subscribe();
  }

  function effect() {
    if (controller.cleanup) controller.cleanup();
    run();
    // TODO: Architectural Decision
    // At the moment if `fn` succeeds at least once in execution
    // we will setup a subscription and every subsequent update of a tag
    // will cause it to be re-evaluated.
    // Q: Should it instead unsubscribe? Or is ok to retry once new data is in?
  }

  return () => controller.unsubscribe();
}
