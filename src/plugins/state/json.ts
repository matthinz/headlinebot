import fs from "node:fs";
import zlib from "node:zlib";
import { StateSchema } from "../../schema";
import { State } from "../../types";

export async function loadStateFromJsonFile(
  file: string,
  gzip: boolean
): Promise<State | undefined> {
  const json = await loadJsonFromFile(file, gzip);

  const parsed = StateSchema.safeParse(json);

  if (!parsed.success) {
    console.error("Warning: State file was invalid.");
    console.error(parsed.error.format());
    return;
  }

  return parsed.data;
}

function loadJsonFromFile(file: string, gzip: boolean): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from("");
    let stream: NodeJS.ReadableStream = fs
      .createReadStream(file)
      .on("error", (err: any) => {
        if (err.code === "ENOENT") {
          resolve(undefined);
        } else {
          reject(err);
        }
      });

    if (gzip) {
      stream = stream.pipe(zlib.createGunzip());
    }

    stream
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

export async function saveStateToJsonFile(
  file: string,
  gzip: boolean,
  state: State
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(file);

    if (gzip) {
      zlib
        .createGzip()
        .end(serializeState(state))
        .pipe(stream)
        .on("error", reject)
        .on("finish", resolve);
    } else {
      stream
        .end(serializeState(state))
        .on("error", reject)
        .on("finish", resolve);
    }
  });
}

export function deserializeState(input: string | Buffer): State {
  const json = JSON.parse(
    typeof input === "string" ? input : input.toString("utf-8")
  );

  return StateSchema.parse(json);
}

export function serializeState(state: State): string {
  return JSON.stringify(state, null, 2);
}
