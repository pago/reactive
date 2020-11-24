import { memoize, ref, reactive, toRefs } from '../src/';

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
});
