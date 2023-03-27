import { addDays } from "date-fns";
import { Logger, Plugin, State } from "../../types";

type Options = {
  logger: Logger;
  maxAgeInDays: number;
};

export function prunePlugin({ logger, maxAgeInDays }: Options): Plugin {
  return async (state: State): Promise<State> => {
    const minDate = addDays(new Date(), -1 * maxAgeInDays);

    return {
      ...state,
      articles: state.articles.filter(({ id, date }) => {
        if (!date) {
          logger.debug("Pruning %s (no date)", id);
          return false;
        } else if (date < minDate) {
          logger.debug("Pruning %s (too old: %s)", id, date.toISOString());
          return false;
        } else {
          return true;
        }
      }),
      cache: state.cache.filter(({ date, url }) => {
        if (date < minDate) {
          logger.debug(
            "Pruning %s from cache (too old: %s)",
            url,
            date.toISOString()
          );
          return false;
        } else {
          return true;
        }
      }),
    };
  };
}
