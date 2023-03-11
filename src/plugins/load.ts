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
        resolve([
          ...articles,
          ...(JSON.parse(buffer.toString("utf-8")) as Article[]),
        ]);
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
  return JSON.parse(input) as Article[];
}

function serializeArticles(articles: Article[]): string {
  return JSON.stringify(articles, null, 2);
}
