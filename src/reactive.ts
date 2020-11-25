import { createTag, consumeTag, dirtyTag, Tag, memoize } from './tag';

/**
 * A tracked reference to a value. Reading it from it should mark it
 * as "read" in the current scope, writing to it should mark it as dirty.
 *
 * When a `Ref` is marked as dirty, any watcher or derivative will eventually
 * be updated to its new value.
 *
 * Note that it is not possible to read and update a ref within the same tracked scope.
 * @public
 */
export interface Ref<T> extends ReadonlyRef<T> {
  current: T;
}

/**
 * A tracked reference to a value that can't be modified.
 * @public
 */
export interface ReadonlyRef<T> {
  readonly current: T;
}

/**
 * An object with only {@link RefObject} values.
 * @public
 */
export type RefContainer<T> = {
  readonly [P in keyof T]: RefObject<T[P]>;
};

/**
 * An Ref object that supports reading & writing in the same tracked scope
 * by providing a specific {@link RefObject.update} method.
 * @public
 */
export interface RefObject<T> extends Ref<T> {
  update(fn: (value: T) => T): void;
}

/**
 * An object that inlines all {@link Ref} values and enables using them transparently.
 * @public
 */
export type Store<T> = {
  [P in keyof T]: T[P] extends Ref<any> ? T[P]['current'] : T[P];
};

/**
 * Creates a new tracked reference value.
 * @param initialValue - The initial value of the reference
 * @public
 */
export function ref<T>(initialValue: T): RefObject<T> {
  const tag = createTag();
  let value = initialValue;
  const self = {
    get current() {
      consumeTag(tag);
      return value;
    },
    set current(newValue) {
      if (!Object.is(value, newValue)) {
        dirtyTag(tag);
      }
      value = newValue;
    },
    update(fn: (value: T) => T) {
      self.current = fn(value);
    },
  };
  return self;
}

function isRefLike(candidate: any): candidate is RefObject<any> {
  return (
    candidate &&
    typeof candidate === 'object' &&
    'current' in candidate &&
    'update' in candidate
  );
}

const updateProxy = Symbol('updateProxy');
interface UpdateableStore {
  [updateProxy]<T>(prop: string, deriveValue: (value: T) => T): void;
}

function isUpdateableStore(store: object): store is UpdateableStore {
  return updateProxy in store;
}

/**
 * Transforms an object into a tracked version. Changing the object returned from `reactive` will also change
 * the original. All watchers and derived values will update.
 * Access to `Object.keys` as well as checking for the existance of a key through the `in` operator will also be tracked.
 *
 * @example
 * Original object is mutated when the reactive object is mutated.
 * ```js
 * const originalState = { message: 'hello' };
 * const state = reactive(originalState);
 * state.message = 'ciao';
 * console.log(originalState.message); // => 'ciao'
 * ```
 *
 * @remarks
 * When a tracked object is destructed, all tracking information is lost.
 * Instead of destructuring a `reactive` object, you need to first convert it with {@link toRefs}.
 *
 * @param initialValue - The underlying object
 * @public
 */
export function reactive<T extends object>(initialValue: T): Store<T> {
  const tagMap: Record<string, Tag> = {};
  const keyTag = createTag();
  function update<K extends keyof T>(
    prop: K,
    deriveValue: (value: T[K]) => T[K]
  ) {
    const r = initialValue[prop];
    if (isRefLike(r)) {
      r.update(deriveValue);
    } else {
      (proxy as T)[prop] = deriveValue(r);
    }
  }
  const proxy = new Proxy<T>(initialValue, {
    get(target: T, prop: string | number, receiver: any) {
      if ((prop as unknown) === updateProxy) {
        return update;
      }
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
      }
      consumeTag(tagMap[prop]);
      const r = Reflect.get(target, prop, receiver);
      return isRefLike(r) ? r.current : r;
    },
    set(target: T, prop: string | number, value: any, receiver: any) {
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
        dirtyTag(keyTag);
      }
      const r = Reflect.get(target, prop, receiver);
      const isRef = isRefLike(r);
      const oldValue = isRef ? r.current : r;
      if (!Object.is(oldValue, value)) {
        // TODO: Do I really need to dirty a tag that was just created? When would that be necessary?
        dirtyTag(tagMap[prop]);
      }
      if (isRef) {
        r.current = value;
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
    ownKeys(target: T) {
      consumeTag(keyTag);
      return Reflect.ownKeys(target);
    },
    deleteProperty(target: T, prop: string | number) {
      dirtyTag(keyTag);
      if (tagMap[prop]) {
        dirtyTag(tagMap[prop]);
      }
      return Reflect.deleteProperty(target, prop);
    },
    has(target: T, prop: string | number) {
      if ((prop as unknown) === updateProxy) {
        return true;
      }
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
      }
      consumeTag(tagMap[prop]);
      return Reflect.has(target, prop);
    },
  }) as Store<T>;

  return proxy;
}

/**
 * Converts a tracked object into an object of {@link Ref} instances.
 * @param store - A tracked object created through {@link reactive}.
 *
 * @public
 */
export function toRefs<T extends { [key: string]: any }>(
  store: Store<T>
): RefContainer<T> {
  return Object.keys(store).reduce((obj: RefContainer<T>, prop: string) => {
    const value = toRef(store, prop);
    Object.defineProperty(obj, prop, {
      configurable: false,
      enumerable: true,
      writable: false,
      value,
    });
    return obj;
  }, {} as RefContainer<T>);
}

/**
 * Extracts a single property from a tracked object into a {@link RefObject}.
 *
 * @param store - A tracked object that was created through {@link reactive}.
 * @param prop - The name of the property that should be extracted into a {@link RefObject}
 *
 * @example
 * ```js
 * const state = reactive({ message: 'hello' });
 * const message = toRef(state, 'message');
 * console.log(message.current);
 * ```
 *
 * @public
 */
export function toRef<T extends object, K extends keyof T>(
  store: T,
  prop: K
): RefObject<T[K]> {
  return {
    get current() {
      return store[prop];
    },
    set current(value: T[K]) {
      store[prop] = value;
    },
    update(fn: (value: T[K]) => T[K]) {
      if (isUpdateableStore(store)) {
        store[updateProxy](prop as string, fn);
      }
    },
  };
}

/**
 * Returns a {@link ReadonlyRef} whose value will always point to the latest result of the given function.
 * The function will only be executed once per set of values.
 *
 * @param fn - A function which returns a derivation of tracked objects or references.
 *
 * @example
 * ```js
 * const name = ref('Preact');
 * const greet = derived(() => `Hello ${name.current}!`);
 * console.log(greet.current); // => 'Hello Preact'
 * name.current = 'React';
 * console.log(greet.current); // => 'Hello React'
 * ```
 *
 * @public
 */
export function derived<T>(fn: () => T): ReadonlyRef<T> {
  const calculator = memoize(fn);
  return {
    get current() {
      return calculator();
    },
  };
}

/**
 * Converts a mutable {@link Ref} to a {@link ReadonlyRef}.
 * @param ref - A mutable tracked reference
 * @public
 */
export function readonly<T>(ref: Ref<T>): ReadonlyRef<T> {
  return derived(() => ref.current);
}
