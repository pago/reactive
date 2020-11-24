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

export const jsx = withFactory(_jsx);
export const jsxs = withFactory(_jsxs);
export const createElement = withFactory(_createElement);
