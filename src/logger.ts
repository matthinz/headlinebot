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
  };

  return logger;

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
}
