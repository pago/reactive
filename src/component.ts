import {
  useEffect,
  useRef,
  useState,
  useContext,
  MutableRefObject,
  Context,
  ReactElement,
} from 'react';
import { reactive, ReadonlyRef, Ref, ref } from './reactive';
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
/**
 * Converts a Reactive Function Component into a React Function Component.
 * A Reactive Function Component returns a render function which is automatically tracked. If none of its input values have changed,
 * the `render` function will not execute during consequitive renderings of the component. Instead, the old virtual DOM tree will be returned,
 * enabling frameworks like React and Preact to bail out of rendering early on.
 *
 * It is usually a better developer experience to configure your Build tool to use `@pago/reactive` as the `@jsxImportSource`
 * or the `@jsxFactory`.
 *
 * @remarks
 * When given a standard React Function component, it will notice that it isn't a Reactive Function Component and bail out without causing significant overhead.
 * Thus you don't really need to care about whether you are using it with a React Function Component or a Reactive Function Component.
 *
 * @param construct - A Reactive Function Component
 * @public
 */
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

/**
 * Sometimes your components will need to initiate side effects to start fetching data, etc.
 * This function enables you to implement that behaviour. The provided `effect` will be observed
 * and will run automatically whenever any of its tracked values change.
 * It will automatically be invalidated when the component is unmounted.
 *
 * The function passed into `effect` will behave similarly to one that is passed to Reacts `useEffect`
 * in that it won't be executed during server side rendering.
 *
 * @param fn - An effect that should be run after the component has been mounted.
 * @public
 */
export function effect(fn: (onInvalidate: (teardown: Effect) => void) => void) {
  fromHook(function MyEffect() {
    useEffect(() => watchEffect(fn), []);
  });
}

/**
 * The function passed to `fromHook` will always be executed when rendering the component.
 *
 * @example
 * ```
 * const screenSize = fromHook(() => useScreenSize());
 * effect(() => console.log(screenSize.current));
 * ```
 *
 * @param fn - A callback that uses React Hooks to calculate an observed value.
 * @public
 */
export function fromHook<T>(fn: () => T): Ref<T> {
  if (!currentEffects) {
    throw new Error(`Tried to execute a hook when not within a component.`);
  }
  const value = ref(fn());
  currentEffects.push(() => (value.current = fn()));
  return value;
}

/**
 * Injects a React.Context into a Reactive Function Component.
 * @param context - The React.Context that should be injected into your component.
 * @public
 */
export function inject<T>(context: Context<T>): ReadonlyRef<T> {
  return fromHook(() => useContext(context));
}

/**
 * This function is a pure type-cast to avoid TypeScript from complaining when using
 * a Reactive Function Component without {@link wrap}.
 * @param render - The render function of a component
 * @public
 */
export function r(render: () => JSX.Element) {
  return (render as unknown) as JSX.Element;
}
