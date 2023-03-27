import { Logger, Plugin, State } from "../../types";
import { loadStateFromJsonFile, saveStateToJsonFile } from "./json";

type Options = {
  file: string;
  logger: Logger;
};

export function loadPlugin({ file, logger }: Options): Plugin {
  return async (state: State): Promise<State> => {
    const shouldGUnzip = /\.gz$/.test(file);

    const start = performance.now();
    logger.debug("Loading state from %s", file);

    const loaded = await loadStateFromJsonFile(file, shouldGUnzip);

    logger.debug("Loaded state in %dms", performance.now() - start);

    if (!loaded) {
      logger.debug("No state found in %s", file);
      return state;
    }

    return {
      articles: [...state.articles, ...loaded.articles],
      cache: [...state.cache, ...loaded.cache],
    };
  };
}

export function savePlugin({ file, logger }: Options): Plugin {
  return async (state: State): Promise<State> => {
    const shouldGzip = /\.gz$/.test(file);

    logger.debug("Saving state to %s", file);
    const start = performance.now();

    await saveStateToJsonFile(file, shouldGzip, state);

    logger.debug("Saved state in %sms", performance.now() - start);

    return state;
  };
}
