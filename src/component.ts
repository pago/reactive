import {
  useEffect,
  useRef,
  useState,
  useContext,
  MutableRefObject,
  Context,
  ReactElement,
} from 'react';
import { reactive, Ref, ref } from './reactive';
import { mergePropsIntoReactive } from './utils';
import {
  memoize,
  collectSubscriptions,
  SubscriptionController,
  watchEffect,
} from './tag';

type RenderResult = ReactElement<any, any> | null;
type RenderFunction = () => RenderResult;

type Effect = () => void;

let currentEffects: undefined | Array<Effect>;
export function wrap<T extends object>(
  construct: (props: T) => RenderFunction | RenderResult
) {
  function ReactiveComponent(props: T): RenderResult {
    const isReactiveComponent = useRef(true);
    const [, forceRender] = useState(0);
    const reactiveProps = useRef<T>() as MutableRefObject<T>;
    const render = useRef() as MutableRefObject<RenderFunction>;
    const subscriptions = useRef() as MutableRefObject<
      Array<SubscriptionController>
    >;
    const hooks = useRef([] as Array<Effect>);
    const [subscriptionController] = useState(
      () =>
        new SubscriptionController(function dependenciesInvalidated() {
          forceRender(x => x + 1);
        })
    );

    useEffect(() => {
      subscriptionController.subscribe();
      subscriptions.current.forEach(controller => controller.subscribe());
      return () => {
        subscriptionController.unsubscribe();
        subscriptions.current.forEach(controller => controller.unsubscribe());
      };
    }, [subscriptionController, subscriptions]);

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
        const oldEffects = currentEffects;
        currentEffects = hooks.current;
        try {
          const doRender = construct(reactiveProps.current);
          if (typeof doRender !== 'function') {
            isReactiveComponent.current = false;
            render.current = () => doRender;
          } else {
            render.current = memoize(doRender, subscriptionController);
          }
        } finally {
          currentEffects = oldEffects;
        }
      });
    } else {
      // during initial construction all contexts will have an up to date value anyways
      // but when we are re-rendering the context values might be stale
      hooks.current.forEach(fn => fn());
    }

    return render.current();
  }
  ReactiveComponent.displayName =
    (construct as any).displayName || construct.name;
  return ReactiveComponent;
}

export function effect(fn: (onInvalidate: (teardown: Effect) => void) => void) {
  fromHook(function MyEffect() {
    useEffect(() => watchEffect(fn), []);
  });
}

export function fromHook<T>(fn: () => T): Ref<T> {
  if (!currentEffects) {
    throw new Error(`Tried to execute a hook when not within a component.`);
  }
  const value = ref(fn());
  currentEffects.push(() => (value.current = fn()));
  return value;
}

export function inject<T>(context: Context<T>) {
  return fromHook(() => useContext(context));
}

/**
 * This function is a pure type-cast to avoid TypeScript from complaining when
 * @param render The render function of a component
 */
export function r(render: () => JSX.Element) {
  return (render as unknown) as JSX.Element;
}
