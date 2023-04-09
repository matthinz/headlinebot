import { Logger, Plugin, State } from "../../types";
import { loadStateFromJsonFile, saveStateToJsonFile } from "./json";
import { loadStateFromSqlite, saveStateToSqliteFile } from "./sqlite";

type Options = {
  file: string;
  logger: Logger;
};

export { prunePlugin } from "./prune";

export function loadPlugin({ file, logger }: Options): Plugin {
  return async (state: State): Promise<State> => {
    const start = performance.now();
    logger.debug("Loading state from %s", file);

    let loaded: State | undefined;

    if (isJson(file)) {
      loaded = await loadStateFromJsonFile(file, isGzip(file));
    } else {
      loaded = await loadStateFromSqlite(file);
    }

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
    logger.debug("Saving state to %s", file);
    const start = performance.now();

    if (isJson(file)) {
      await saveStateToJsonFile(file, isGzip(file), state);
    } else {
      await saveStateToSqliteFile(file, state);
    }
    logger.debug("Saved state in %sms", performance.now() - start);

    return state;
  };
}

function isJson(filename: string) {
  return /\.json(\.gz)?$/.test(filename);
}

function isGzip(filename: string) {
  return /\.gz$/.test(filename);
}
