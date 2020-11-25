import { watchEffect, ref, reactive, toRef } from '../src';
import { delay } from './util';

describe('watchEffect', () => {
  test('it executes', () => {
    const x = ref(0);
    let currentValue = -1;
    watchEffect(() => {
      currentValue = x.current;
    });
    expect(currentValue).toBe(0);
  });

  test('it executes when a ref changes', async () => {
    const { signal, resolve } = delay();
    const x = ref(0);
    const y = ref(0);
    let currentValue = 0;
    watchEffect(() => {
      currentValue += x.current + y.current;
      if (currentValue !== 0) {
        resolve();
      }
    });
    expect(currentValue).toBe(0);
    setTimeout(() => {
      x.current = 1;
      y.current = 2;
    }, 0);
    await signal;
    expect(currentValue).toBe(3);
  });

  test('it executes when a ref changes with update', async () => {
    const { signal, resolve } = delay();
    const x = ref(0);
    const y = ref(0);
    const currentValue = ref(0);
    watchEffect(() => {
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

  test('it executes when a ref from a proxied ref changes with update', async () => {
    const { signal, resolve } = delay();
    const x = ref(0);
    const y = ref(0);
    const currentValue = ref(0);
    const state = reactive({ currentValue });
    const v = toRef(state, 'currentValue');
    watchEffect(() => {
      v.update(curr => curr + x.current + y.current);
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
    const unsubscribe = watchEffect(() => {
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
    watchEffect(onInvalidate => {
      firstTimerStarted.resolve();
      let val = x.current;
      const timer = setTimeout(() => {
        currentValue = val;
        timerExecuted.resolve();
      }, val);
      onInvalidate(() => {
        cleanupInvoked = true;
        clearTimeout(timer);
      });
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
    const unsubscribe = watchEffect(onInvalidate => {
      firstTimerStarted.resolve();
      const timer = setTimeout(() => {
        fail('Timer has not been cancelled!');
      }, 1);
      onInvalidate(() => {
        cleanupInvoked = true;
        clearTimeout(timer);
      });
    });
    await firstTimerStarted.signal;
    unsubscribe();
    expect(cleanupInvoked).toBe(true);
  });
});
