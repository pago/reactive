import { useState, useEffect } from 'react';
import { RefObject } from './reactive';
import { watchEffect } from './tag';

/**
 * Returns the current value of a {@link RefObject} and starts
 * to track its value once the component has been mounted.
 *
 * An update will be scheduled if the value of the reference has changed
 * between the first render of the component and mounting it.
 *
 * @param ref - A tracked reference object.
 * @public
 */
export function useRefValue<T>(ref: RefObject<T>) {
  const [state, setState] = useState(ref.current);
  useEffect(() => {
    return watchEffect(() => {
      if (state !== ref.current) {
        setState(ref.current);
      }
    });
  }, [ref, state]);
  return state;
}
