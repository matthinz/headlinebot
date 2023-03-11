import fs from "node:fs";
import zlib from "node:zlib";
import { Article } from "../types";

export async function loadPlugin(articles: Article[]): Promise<Article[]> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from("");

    fs.createReadStream(getArticlesFile())
      .on("error", (err: any) => {
        if (err.code === "ENOENT") {
          resolve(articles);
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
        resolve([...articles, ...parseArticles(buffer)]);
      });
  });
}

export async function savePlugin(articles: Article[]): Promise<Article[]> {
  return new Promise((resolve, reject) => {
    zlib
      .createGzip()
      .end(serializeArticles(articles))
      .pipe(fs.createWriteStream(getArticlesFile()))
      .on("error", reject)
      .on("finish", () => {
        resolve(articles);
      });
  });
}

function getArticlesFile(): string {
  return process.env.ARTICLES_FILE ?? ".articles.json.gz";
}

function parseArticles(input: string | Buffer): Article[] {
  input = typeof input === "string" ? input : input.toString("utf-8");
  const result = JSON.parse(input, reviver) as Article[];

  if (!Array.isArray(result)) {
    return [];
  }

  return result
    .map((incoming) => {
      if (!incoming) {
        return;
      }
      incoming.metadata = incoming.metadata ?? {};
      return incoming as Article;
    })
    .filter(Boolean);

  function reviver(key: string, value: any) {
    if (key === "date") {
      if (value) {
        value = new Date(value);
      }
    }

    return value;
  }
}

function serializeArticles(articles: Article[]): string {
  return JSON.stringify(articles, null, 2);
}
