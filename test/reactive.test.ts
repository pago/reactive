import { memoize, ref, reactive, toRefs, observe, derived } from '../src/index';
import { delay } from './util';

describe('memoize', () => {
  test('it executes the function again when a ref is modified', () => {
    const state = ref('World');
    const fn = memoize(() => {
      return `Hello ${state.current}!`;
    });

    expect(fn()).toEqual('Hello World!');
    state.current = 'Universe';
    expect(fn()).toEqual('Hello Universe!');
  });

  test('it avoids execution of the function when a ref is modified but its value is unchanged', () => {
    const state = ref('World');
    const fn = memoize(() => {
      return { message: state.current };
    });

    const firstResult = fn();
    state.current = 'World';
    const secondResult = fn();

    expect(firstResult).toBe(secondResult);
    state.current = 'Universe';
    const thirdResult = fn();
    expect(firstResult).not.toBe(thirdResult);
  });

  test('it executes the function again when a reactive is modified', () => {
    const state = reactive({
      target: 'World',
    });
    const fn = memoize(() => {
      return `Hello ${state.target}!`;
    });

    expect(fn()).toEqual('Hello World!');
    state.target = 'Universe';
    expect(fn()).toEqual('Hello Universe!');
  });

  test('it executes the function again when a reactive gains a new property', () => {
    const state = reactive<{ target: string; greeting?: string }>({
      target: 'World',
    });
    const fn = memoize(() => {
      return Object.keys(state);
    });

    expect(fn()).toEqual(['target']);
    state.greeting = 'Hello';
    expect(fn()).toEqual(['target', 'greeting']);

    delete state.greeting;
    expect(fn()).toEqual(['target']);
  });

  test('it executes the function again when a reactive gains a new property that is tested with "in"', () => {
    const state = reactive<{ target: string; greeting?: string }>({
      target: 'World',
    });
    const fn = memoize(() => {
      return `${'greeting' in state ? state.greeting : 'Hello'} ${
        state.target
      }`;
    });

    expect(fn()).toEqual('Hello World');
    state.greeting = 'Good night';
    expect(fn()).toEqual('Good night World');

    delete state.greeting;
    expect(fn()).toEqual('Hello World');
  });

  test('it can use a ref in a reactive', () => {
    const target = ref('World');
    const state = reactive<{ target: string; greeting?: string }>({
      get target() {
        return target.current;
      },
    });
    const fn = memoize(() => {
      return `${'greeting' in state ? state.greeting : 'Hello'} ${
        state.target
      }`;
    });

    expect(fn()).toEqual('Hello World');
    state.greeting = 'Good night';
    expect(fn()).toEqual('Good night World');

    delete state.greeting;
    expect(fn()).toEqual('Hello World');
  });

  test('it can convert a reactive to refs', () => {
    const state = reactive({
      target: 'World',
      greeting: 'Hello',
    });
    const { target, greeting } = toRefs(state);
    const fn = memoize(() => {
      return `${greeting.current} ${target.current}`;
    });

    expect(fn()).toEqual('Hello World');
    state.greeting = 'Good night';
    expect(fn()).toEqual('Good night World');

    greeting.current = 'Hello';
    expect(fn()).toEqual('Hello World');
    expect(state.greeting).toEqual('Hello');
  });

  describe('observe', () => {
    test('it executes', () => {
      const x = ref(0);
      let currentValue = -1;
      observe(() => {
        currentValue = x.current;
      });
      expect(currentValue).toBe(0);
    });

    test('it executes when a ref changes', async () => {
      const { signal, resolve } = delay();
      const x = ref(0);
      const y = ref(0);
      let currentValue = 0;
      observe(() => {
        currentValue += x.current + y.current;
      });
      expect(currentValue).toBe(0);
      setTimeout(() => {
        x.current = 1;
        y.current = 2;
        resolve();
      }, 0);
      await signal;
      expect(currentValue).toBe(3);
    });

    test('it executes when a ref changes with update', async () => {
      const { signal, resolve } = delay();
      const x = ref(0);
      const y = ref(0);
      const currentValue = ref(0);
      observe(() => {
        currentValue.update(curr => curr + x.current + y.current);
      });
      expect(currentValue.current).toBe(0);
      setTimeout(() => {
        x.current = 1;
        y.current = 2;
        resolve();
      }, 0);
      await signal;
      expect(currentValue.current).toBe(3);
    });

    test('can be unsubscribed', async () => {
      const { signal, resolve } = delay();
      const x = ref(0);
      const y = ref(0);
      let currentValue = 0;
      const { unsubscribe } = observe(() => {
        currentValue += x.current + y.current;
      });
      expect(currentValue).toBe(0);
      setTimeout(() => {
        x.current = 1;
        y.current = 2;
        setTimeout(() => {
          unsubscribe();
          x.current = 2;
          y.current = 4;
          resolve();
        }, 0);
      }, 0);
      await signal;
      expect(currentValue).toBe(3);
    });

    test('runs a cleanup before effect', async () => {
      const firstTimerStarted = delay();
      const timerExecuted = delay();
      const x = ref(1);
      let currentValue = 0;
      let cleanupInvoked = false;
      observe(() => {
        firstTimerStarted.resolve();
        let val = x.current;
        const timer = setTimeout(() => {
          currentValue = val;
          timerExecuted.resolve();
        }, val);
        return () => {
          cleanupInvoked = true;
          clearTimeout(timer);
        };
      });
      await firstTimerStarted.signal;
      x.current = 0;
      await timerExecuted.signal;
      expect(currentValue).toBe(0);
      expect(cleanupInvoked).toBe(true);
    });

    test('runs cleanup when unsubscribed', async () => {
      const firstTimerStarted = delay();
      let cleanupInvoked = false;
      const { unsubscribe } = observe(() => {
        firstTimerStarted.resolve();
        const timer = setTimeout(() => {
          fail('Timer has not been cancelled!');
        }, 1);
        return () => {
          cleanupInvoked = true;
          clearTimeout(timer);
        };
      });
      await firstTimerStarted.signal;
      unsubscribe();
      expect(cleanupInvoked).toBe(true);
    });
  });
});

describe('derived', () => {
  test('returns the initial value', () => {
    const x = ref(2);
    const double = derived(() => x.current * 2);
    expect(double.current).toBe(4);
  });

  test('keeps the value up to date', () => {
    const x = ref(2);
    const double = derived(() => x.current * 2);
    x.current = 4;
    expect(double.current).toBe(8);
  });
});
