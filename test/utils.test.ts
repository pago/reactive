import { reactive, memoize } from '../src';
import { mergePropsIntoReactive } from '../src/utils';

describe('mergePropsIntoReactive', () => {
  test('updates all values in props', () => {
    const props = reactive({
      hello: 'world',
    });
    const serialize = memoize(() => {
      return JSON.stringify(props);
    });
    expect(serialize()).toEqual(JSON.stringify({ hello: 'world' }));
    mergePropsIntoReactive(props, {
      hello: 'universe',
    });
    expect(serialize()).toEqual(JSON.stringify({ hello: 'universe' }));
  });

  test('inserts new values into props', () => {
    const props = reactive<{ hello: string; message?: string }>({
      hello: 'world',
    });
    const serialize = memoize(() => {
      return JSON.stringify(props);
    });
    expect(serialize()).toEqual(JSON.stringify({ hello: 'world' }));
    mergePropsIntoReactive(props, {
      hello: 'universe',
      message: 'hello',
    });
    expect(serialize()).toEqual(
      JSON.stringify({ hello: 'universe', message: 'hello' })
    );
  });

  test('removes old values from props', () => {
    const props = reactive<{ hello: string; message?: string }>({
      hello: 'world',
      message: 'hello',
    });
    const serialize = memoize(() => {
      return JSON.stringify(props);
    });
    expect(serialize()).toEqual(
      JSON.stringify({ hello: 'world', message: 'hello' })
    );
    mergePropsIntoReactive(props, {
      hello: 'world',
    });
    expect(serialize()).toEqual(JSON.stringify({ hello: 'world' }));
  });

  test('does not recalculate if values are unchanged', () => {
    const props = reactive({
      hello: 'world',
    });
    const fn = memoize(() => {
      return { message: props.hello };
    });
    const firstValue = fn();
    const secondValue = fn();
    expect(firstValue).toBe(secondValue);
    mergePropsIntoReactive(props, {
      hello: 'world',
    });
    const thirdValue = fn();
    expect(firstValue).toBe(thirdValue);
  });
});
