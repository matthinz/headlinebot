import { Article, RequestedDocument, Plugin, State } from "../../types";
import { ArticleSchema, RequestedDocumentSchema } from "../../schema";
import * as sqlite from "sqlite";
import sqlite3 from "sqlite3";

export async function loadStateFromSqlite(file: string): Promise<State> {
  const db = await openDb(file);

  const articles: Article[] = [];
  await db.each("SELECT json FROM articles", [], (err, row) => {
    if (err) {
      throw err;
    }
    articles.push(ArticleSchema.parse(JSON.parse(row["json"])));
  });

  const cache: RequestedDocument[] = [];
  await db.each("SELECT json FROM cache", [], (err, row) => {
    if (err) {
      throw err;
    }
    const parsed = RequestedDocumentSchema.parse(JSON.parse(row["json"]));
    cache.push(parsed);
  });

  return {
    articles,
    cache,
  };
}

export async function saveStateToSqliteFile(
  file: string,
  state: State
): Promise<void> {
  const db = await openDb(file);

  await Promise.all(
    state.articles.map(async (article) => {
      await db.run(
        "INSERT INTO articles (id,json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
        [article.id, JSON.stringify(article)]
      );
    })
  );

  await Promise.all(
    state.cache.map(async (doc) => {
      const id = [doc.url, doc.date.toISOString()].join("-");
      await db.run(
        "INSERT INTO cache (id,json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
        [id, JSON.stringify(doc)]
      );
    })
  );
}

async function openDb(
  filename: string
): Promise<sqlite.Database<sqlite3.Database, sqlite3.Statement>> {
  const db = await sqlite.open({
    filename,
    driver: sqlite3.Database,
  });

  await db.run("CREATE TABLE IF NOT EXISTS cache(id TEXT UNIQUE, json TEXT)");

  await db.run(
    `CREATE TABLE IF NOT EXISTS articles(id TEXT UNIQUE, json TEXT)`
  );

  return db;
}
