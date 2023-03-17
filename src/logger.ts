import { format } from "node:util";
import { Logger } from "./types";

export type CreateConsoleLoggerOptions = {
  out?: NodeJS.WriteStream;
  err?: NodeJS.WriteStream;
  verbose: boolean;
};

export function createConsoleLogger({
  out = process.stdout,
  err = process.stderr,
  verbose,
}: CreateConsoleLoggerOptions): Logger {
  const logger = {
    debug,
    info,
    warn,
  };

  return Object.freeze(logger);

  function debug(...args: any[]): Logger {
    if (verbose) {
      err.write(format(...args));
      err.write("\n");
    }
    return logger;
  }

  function info(...args: any[]): Logger {
    out.write(format(...args));
    out.write("\n");
    return logger;
  }

  function warn(...args: any[]): Logger {
    err.write(format(...args));
    err.write("\n");
    return logger;
  }
}
