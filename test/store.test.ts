import { readable, memoize } from '../src/';
import { delay } from './util';

describe('readable', () => {
  test('derivations are updated when value is changed', async () => {
    const { signal, resolve } = delay();
    const message = readable('Hello', set => {
      setTimeout(() => {
        set('Goodbye');
        resolve();
      }, 0);
    });
    const fn = memoize(() => {
      return `${message.current} World!`;
    });
    expect(fn()).toEqual('Hello World!');
    await signal;
    expect(fn()).toEqual('Goodbye World!');
  });
});
