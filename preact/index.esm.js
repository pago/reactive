import { options } from 'preact';
import { wrap } from '../';
export * from '../';

const map = new WeakMap();
const vnode = options.vnode;
options.vnode = node => {
  if (vnode) vnode(node);
  let type = node.type;
  if (
    typeof type === 'function' &&
    !('prototype' in type && type.prototype.render)
  ) {
    if (!map.has(type)) {
      map.set(type, wrap(type));
    }
    node.type = map.get(type);
  }
};
