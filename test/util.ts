export function delay<T = any>() {
  let resolve: (value?: T) => void = undefined as any;
  const signal = new Promise(res => (resolve = res));
  return { signal, resolve };
}
