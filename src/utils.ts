import { Article } from "./types";

export type Milliseconds = number;

export function augmentArticle(
  article: Article,
  props: Omit<Partial<Article>, "metadata">,
  metadata?: Article["metadata"]
): Article {
  return {
    ...article,
    ...props,
    metadata: {
      ...(article.metadata ?? {}),
      ...(metadata ?? {}),
    },
  };
}

export function asyncMap<In, Out>(
  items: In[],
  mapper: (input: In) => Promise<Out>
): Promise<Out[]> {
  return items.reduce<Promise<Out[]>>(
    (promise, item) =>
      promise.then(async (result) => {
        result.push(await mapper(item));
        return result;
      }),
    Promise.resolve([])
  );
}

export function oldestToNewestByDate<T extends { date?: Date }>(
  a: T,
  b: T
): number {
  if (!a.date && !b.date) {
    return 0;
  } else if (!a.date) {
    return -1;
  } else if (!b.date) {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  } else if (a.date > b.date) {
    return 1;
  } else {
    return 0;
  }
}

export function delay(min: Milliseconds, max: Milliseconds): Promise<void>;
export function delay(
  minOrExact: Milliseconds,
  max?: Milliseconds
): Promise<void> {
  const duration =
    max == null ? minOrExact : minOrExact + Math.random() * (max - minOrExact);
  return new Promise((resolve) => setTimeout(resolve, duration));
}
