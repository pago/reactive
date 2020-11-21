// Based on https://www.pzuraq.com/how-autotracking-works/

type Revision = number;

let CURRENT_REVISION: Revision = 0;

//////////

const REVISION = Symbol('REVISION');

class Tag {
  [REVISION] = CURRENT_REVISION;
}

export function createTag() {
  return new Tag();
}

//////////

let onTagDirtied = () => {};

export function setOnTagDirtied(callback: () => void) {
  onTagDirtied = callback;
}

export function dirtyTag(tag: Tag) {
  if (currentComputation && currentComputation.has(tag)) {
    throw new Error('Cannot dirty tag that has been used during a computation');
  }

  tag[REVISION] = ++CURRENT_REVISION;
  onTagDirtied();
}

//////////

let currentComputation: null | Set<Tag> = null;

export function consumeTag(tag: Tag) {
  if (currentComputation !== null) {
    currentComputation.add(tag);
  }
}

function getMax(tags: Tag[]) {
  return Math.max(...tags.map(t => t[REVISION]));
}

export function memoizeFunction<T>(fn: () => T): () => T {
  let lastValue: T | undefined;
  let lastRevision: Revision | undefined;
  let lastTags: Tag[] | undefined;

  return () => {
    if (lastTags && getMax(lastTags) === lastRevision) {
      if (currentComputation && lastTags.length > 0) {
        lastTags.forEach(tag => currentComputation?.add(tag));
      }

      return lastValue as T;
    }

    let previousComputation = currentComputation;
    currentComputation = new Set();

    try {
      lastValue = fn();
    } finally {
      lastTags = Array.from(currentComputation);
      lastRevision = getMax(lastTags);

      if (previousComputation && lastTags.length > 0) {
        lastTags.forEach(tag => previousComputation?.add(tag));
      }

      currentComputation = previousComputation;
    }

    return lastValue;
  };
}
