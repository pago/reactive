import { ref } from './reactive';

interface Setter<T> {
  (value: T): void;
}

interface Updater<T> {
  (set: Setter<T>): void;
}

export function readable<T>(initialValue: T, updater?: Updater<T>) {
  const value = ref(initialValue);
  updater?.((newValue: T) => {
    value.current = newValue;
  });
  return {
    get current() {
      return value.current;
    },
  };
}

// export function writable<T>(initialValue) {

// }
