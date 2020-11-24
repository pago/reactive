import { derived, ref } from '../src';

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
