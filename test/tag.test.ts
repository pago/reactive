import { consumeTag, dirtyTag, createTag, derive } from '../src/tag';

describe('tag', () => {
  test('it memoizes the function', () => {
    const fn = derive(() => {
      return {};
    });
    const firstValue = fn();
    const secondValue = fn();
    expect(firstValue).toBe(secondValue);
  });

  test('when an unused tag is dirtied the return value is still cached', () => {
    const tag = createTag();
    const fn = derive(() => {
      return {};
    });
    const firstValue = fn();
    dirtyTag(tag);
    const secondValue = fn();
    expect(firstValue).toBe(secondValue);
  });

  test('it executes the function again when a dirty tag is consumed', () => {
    const tag = createTag();
    const fn = derive(() => {
      consumeTag(tag);
      return {};
    });
    const firstValue = fn();
    dirtyTag(tag);
    const secondValue = fn();
    expect(firstValue).not.toBe(secondValue);
  });
});
