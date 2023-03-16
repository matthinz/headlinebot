import fs from "node:fs";
import zlib from "node:zlib";
import { State } from "../types";

export async function savePlugin(state: State): Promise<State> {
  return new Promise((resolve, reject) => {
    zlib
      .createGzip()
      .end(serializeState(state))
      .pipe(fs.createWriteStream(".state.json.gz"))
      .on("error", reject)
      .on("finish", () => {
        resolve(state);
      });
  });
}

export function serializeState(state: State): string {
  return JSON.stringify(state, null, 2);
}
