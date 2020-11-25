// For some reason the project seems to think that `jsx` and `jsxs` don't exist. Yet, they work fine...
// @ts-expect-error
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { wrap } from './component';
import { createElement as _createElement } from 'react';

const map = new WeakMap();
const withFactory = (factory: (...args: any) => JSX.Element) => (
  type: any,
  ...rest: any[]
) => {
  if (
    typeof type === 'function' &&
    !('prototype' in type && type.prototype.render)
  ) {
    // it's a function component
    if (!map.has(type)) {
      map.set(type, wrap(type));
    }
    type = map.get(type);
  }
  return factory(type, ...rest);
};

/**
 * An interceptor for the standard React `jsx` function from the `react/jsx-runtime` package.
 * @public
 */
export const jsx = withFactory(_jsx);
/**
 * An interceptor for the standard React `jsxs` function from the `react/jsx-runtime` package.
 * @public
 */
export const jsxs = withFactory(_jsxs);
/**
 * An interceptor for the standard React `createElement` function from the `react` package.
 * @public
 */
export const createElement = withFactory(_createElement);
