import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { derive, reactive } from './index';
import type { Subscription } from './index';
import { mergePropsIntoReactive } from './utils';
import { collectSubscriptions } from './tag';
import type { ReactElement } from 'react';

type RenderResult = ReactElement<any, any> | null;
type RenderFunction = () => RenderResult;

export function wrap<T extends object>(construct: (props: T) => RenderFunction | RenderResult) {
    return function ReactiveComponent(props: T): RenderResult {
        const isReactiveComponent = useRef(true);
        const [, forceRender] = useState(0);
        const reactiveProps = useRef<T>() as MutableRefObject<T>;
        const render = useRef() as MutableRefObject<RenderFunction>;
        const subscriptions = useRef() as MutableRefObject<Array<Subscription>>;

        useEffect(function cleanup() {
            return () => subscriptions.current?.forEach(subscription => {
                subscription.unsubscribe();
            });
        }, []);

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
                const doRender = construct(reactiveProps.current);
                if (typeof doRender !== 'function') {
                    isReactiveComponent.current = false;
                    render.current = () => doRender;
                } else {
                    render.current = derive(doRender, () => {
                        forceRender(x => x + 1);
                    });
                }
            });
        }

        return render.current();
    };
}