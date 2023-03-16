import fs from "node:fs";
import zlib from "node:zlib";
import { StateSchema } from "../schema";
import { State } from "../types";

export async function loadPlugin(state: State): Promise<State> {
  const json = await loadJsonFromGzippedFile(
    process.env.STATE_FILE ?? ".state.json.gz"
  );

  const parsed = StateSchema.safeParse(json);

  if (!parsed.success) {
    console.error("Warning: State file was invalid.");
    console.error(parsed.error.format());
    return state;
  }

  return {
    articles: [...state.articles, ...parsed.data.articles],
    cache: [...state.cache, ...parsed.data.cache],
  };
}

function loadJsonFromGzippedFile(file: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from("");
    fs.createReadStream(file)
      .on("error", (err: any) => {
        if (err.code === "ENOENT") {
          resolve(undefined);
        } else {
          reject(err);
        }
      })
      .pipe(zlib.createGunzip())
      .on("data", (chunk) => (buffer = Buffer.concat([buffer, chunk])))
      .on("error", (err: any) => {
        reject(err);
      })
      .on("end", () => {
        try {
          resolve(JSON.parse(buffer.toString("utf-8")));
        } catch {
          resolve(undefined);
        }
      });
  });
}

export function deserializeState(input: string | Buffer): State {
  const json = JSON.parse(
    typeof input === "string" ? input : input.toString("utf-8")
  );

  return StateSchema.parse(json);
}
