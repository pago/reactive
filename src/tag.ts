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

interface Effect {
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

export class SubscriptionController {
  private tags: Array<Tag> = [];
  private isSubscribed = false;
  private lastRevision: Revision = 0;
  effect: Effect;
  constructor(effect: Effect) {
    this.effect = effect;
  }

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

  unsubscribe() {
    if (!this.isSubscribed) {
      return;
    }
    this.unsubscribeFromTags();
    this.isSubscribed = false;
  }
}

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

export interface Subscription {
  unsubscribe(): void;
}

let subscriptions: Array<Subscription> | undefined;
export function collectSubscriptions<T>(fn: () => T) {
  const oldSubscriptions = subscriptions;
  let subs = (subscriptions = [] as Array<Subscription>);
  let previousComputation = currentComputation;
  currentComputation = new Set();
  let success = false;
  try {
    fn();
    success = true;
  } finally {
    if (success) {
      const lastTags = Array.from(currentComputation);

      if (lastTags.length > 0) {
        lastTags.forEach(tag => {
          previousComputation?.add(tag);
        });
      }
    } else {
      // execution failed, cleanup subscriptions
      subs.forEach(subscription => subscription.unsubscribe());
      subs = [];
    }
    subscriptions = oldSubscriptions;
    currentComputation = previousComputation;
  }
  return subs;
}

export function observe(fn: () => Effect | void): Subscription {
  let lastTags: Tag[] | undefined;
  let cleanup: Effect | undefined;

  const subscription = {
    unsubscribe() {
      lastTags?.forEach(tag => {
        tag.unsubscribe(effect);
      });
      cleanup?.();
    },
  };
  subscriptions?.push(subscription);

  function effect() {
    cleanup?.();
    let previousComputation = currentComputation;
    currentComputation = new Set();

    try {
      cleanup = fn() as Effect;
    } finally {
      // TODO: unsubscribe only from those that are not needed anymore
      lastTags?.forEach(tag => {
        tag.unsubscribe(effect);
      });
      lastTags = Array.from(currentComputation);

      if (lastTags.length > 0) {
        lastTags.forEach(tag => {
          previousComputation?.add(tag);
          tag.subscribe(effect);
        });
      }

      currentComputation = previousComputation;
    }
  }

  effect();

  return subscription;
}
