import { Article } from "../types";

export function printPlugin(articles: Article[]): Promise<Article[]> {
  articles.forEach((a) => {
    console.log("# %s (%s)", a.title, a.url);
  });
  return Promise.resolve(articles);
}
