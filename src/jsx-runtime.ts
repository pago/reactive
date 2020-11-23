import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { wrap } from './component';

const map = new WeakMap();
export function jsx(type: any, ...rest: any[]) {
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
  return _jsx(type, ...rest);
}

export function jsxs(type: any, ...rest: any[]) {
  if (
    typeof type !== 'string' &&
    !('prototype' in type && type.prototype.render)
  ) {
    // it's a function component
    if (!map.has(type)) {
      map.set(type, wrap(type));
    }
    type = map.get(type);
  }
  return _jsxs(type, ...rest);
}

export function createElement(type: any, ...rest: any[]) {
  if (!('prototype' in type && type.prototype.render)) {
    // it's a function component
    if (!map.has(type)) {
      map.set(type, wrap(type));
    }
    type = map.get(type);
  }
  return React.createElement(type, ...rest);
}
