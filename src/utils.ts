export function mergePropsIntoReactive<T>(props: T, newProps: T) {
  // find all prop names that were present in the old set but are missing in the new
  const oldPropNames = new Set(Object.keys(props));
  Object.keys(newProps).forEach(prop => oldPropNames.delete(prop));
  oldPropNames.forEach(prop => delete (props as any)[prop]);
  Object.assign(props, newProps);
  return props;
}
