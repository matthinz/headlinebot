export type Milliseconds = number;

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
