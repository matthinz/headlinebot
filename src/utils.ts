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

export function countdown(target: Date, callback: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeCallback = () => {
      try {
        callback();
        return true;
      } catch (err: any) {
        reject(err);
        return false;
      }
    };

    (async () => {
      while (true) {
        const now = new Date();
        if (now >= target) {
          resolve();
          return;
        }

        const msRemaining = target.getTime() - now.getTime();
        const secondsRemaining = Math.floor(msRemaining / 1000);
        const minutesRemaining = Math.floor(secondsRemaining / 60);

        if (!safeCallback()) {
          return;
        }

        if (minutesRemaining > 10) {
          // When we have > 10 mins remaining, give an update every 5 mins
          await delay(5 * 60 * 1000, 5 * 60 * 1000);
        } else if (minutesRemaining > 1) {
          // Every 1 minute
          await delay(1 * 60 * 1000, 1 * 60 * 1000);
        } else {
          // Every 10 seconds
          await delay(10 * 1000, 10 * 1000);
        }
      }
    })().catch(reject);
  });
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
