import { memoizeFunction } from '../src/reactive';
describe('reactive', () => {
  test('it memoizes the function', () => {
    const fn = memoizeFunction(() => {
      return {};
    });
    const firstValue = fn();
    const secondValue = fn();
    expect(firstValue).toBe(secondValue);
  });
});
