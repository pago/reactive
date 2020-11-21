import { createTag, consumeTag, dirtyTag } from './tag';
import type { Tag } from './tag';

export function ref<T>(initialValue: T) {
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
    }
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

export function toRefs(store: any): any {
  return Object.keys(store).reduce((obj: Record<string, any>, prop: any) => {
    Object.defineProperty(obj, prop, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: {
        get current() {
          return store[prop];
        },
        set current(value) {
          store[prop] = value;
        },
      },
    });
    return obj;
  }, {} as Record<string, any>);
}
