import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  MutableRefObject,
  Context,
  ReactElement,
} from 'react';
import { derive, reactive, ref, Subscription } from './index';
import { mergePropsIntoReactive } from './utils';
import { collectSubscriptions } from './tag';

type RenderResult = ReactElement<any, any> | null;
type RenderFunction = () => RenderResult;

interface UsedContext<T> {
  ref: { current: T };
  context: Context<T>;
}

let currentContexts: undefined | Array<UsedContext<any>>;
export function wrap<T extends object>(
  construct: (props: T) => RenderFunction | RenderResult
) {
  function ReactiveComponent(props: T): RenderResult {
    const isReactiveComponent = useRef(true);
    const [, forceRender] = useState(0);
    const reactiveProps = useRef<T>() as MutableRefObject<T>;
    const render = useRef() as MutableRefObject<RenderFunction>;
    const subscriptions = useRef() as MutableRefObject<Array<Subscription>>;
    const usedContexts = useRef([] as Array<UsedContext<any>>);

    const cleanupSubscriptions = useCallback(() => {
      subscriptions.current?.forEach(subscription => {
        subscription.unsubscribe();
      });
    }, [subscriptions]);

    useEffect(
      function cleanup() {
        return cleanupSubscriptions;
      },
      [cleanupSubscriptions]
    );

    if (!isReactiveComponent.current) {
      return construct(props) as RenderResult;
    }

    if (!reactiveProps.current) {
      reactiveProps.current = reactive(Object.assign({}, props));
    } else {
      mergePropsIntoReactive(reactiveProps.current, props);
    }

    if (!render.current) {
      subscriptions.current = collectSubscriptions(() => {
        const oldContexts = currentContexts;
        currentContexts = usedContexts.current;
        try {
          const doRender = construct(reactiveProps.current);
          if (typeof doRender !== 'function') {
            isReactiveComponent.current = false;
            render.current = () => doRender;
          } else {
            render.current = derive(
              doRender,
              function dependenciesInvalidated() {
                forceRender(x => x + 1);
              }
            );
          }
        } finally {
          currentContexts = oldContexts;
        }
      });
    } else {
      // during initial construction all contexts will have an up to date value anyways
      // but when we are re-rendering the context values might be stale
      usedContexts.current.forEach(({ ref, context }) => {
        ref.current = useContext(context); // eslint-disable-line react-hooks/rules-of-hooks
      });
    }

    let success = false;
    try {
      const renderResult = render.current();
      success = true;
      return renderResult;
    } finally {
      if (!success) {
        cleanupSubscriptions();
      }
    }
  }
  ReactiveComponent.displayName =
    (construct as any).displayName || construct.name;
  return ReactiveComponent;
}

export function inject<T>(context: Context<T>) {
  if (!currentContexts) {
    throw new Error(
      `Tried to inject a context "${context.displayName}" when not within a component.`
    );
  }
  const contextValue = ref(useContext(context)); // eslint-disable-line react-hooks/rules-of-hooks
  currentContexts.push({
    ref: contextValue,
    context,
  });
  return contextValue;
}

/**
 * This function is a pure type-cast to avoid TypeScript from complaining when
 * @param render The render function of a component
 */
export function r(render: () => JSX.Element) {
  return (render as unknown) as JSX.Element;
}

const map = new WeakMap();
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
