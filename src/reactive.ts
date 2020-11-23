import {createTag, consumeTag, dirtyTag, Tag, memoize} from './tag';

export interface Ref<T> {
  current: T;
}

export interface ImmutableRef<T> {
  readonly current: T;
}

export type RefContainer<T> = {
  readonly [P in keyof T]: Ref<T[P]>;
};

export interface RefObject<T> extends Ref<T> {
  update(fn: (value: T) => T): void;
}

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

export function reactive<T extends object>(initialValue: T): T {
  const tagMap: Record<string, Tag> = {};
  const keyTag = createTag();
  return new Proxy<T>(initialValue, {
    get(target: T, prop: string | number, receiver: any) {
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
      }
      consumeTag(tagMap[prop]);
      return Reflect.get(target, prop, receiver);
    },
    set(target: T, prop: string | number, value: any, receiver: any) {
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
        dirtyTag(keyTag);
      }
      const oldValue = Reflect.get(target, prop, receiver);
      if (!Object.is(oldValue, value)) {
        // TODO: Do I really need to dirty a tag that was just created? When would that be necessary?
        dirtyTag(tagMap[prop]);
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
      if (!tagMap[prop]) {
        tagMap[prop] = createTag();
      }
      consumeTag(tagMap[prop]);
      return Reflect.has(target, prop);
    },
  });
}

export function toRefs<T extends { [key: string]: any }>(
  store: T
): RefContainer<T> {
  return Object.keys(store).reduce((obj: RefContainer<T>, prop: string) => {
    const value: Ref<any> = {
      get current() {
        return store[prop];
      },
      set current(value) {
        ((store as unknown) as any)[prop] = value;
      },
    };
    Object.defineProperty(obj, prop, {
      configurable: false,
      enumerable: true,
      writable: false,
      value,
    });
    return obj;
  }, {} as RefContainer<T>);
}

export function toRef<T extends object, K extends keyof T>(
  store: T,
  prop: K
): Ref<T[K]> {
  return {
    get current() {
      return store[prop];
    },
    set current(value: T[K]) {
      store[prop] = value;
    },
  };
}

export function derived<T>(fn: () => T): ImmutableRef<T> {
  const calculator = memoize(fn);
  return {
    get current() {
      return calculator();
    }
  }
}
