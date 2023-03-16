import { Article, State } from "../types";
import { oldestToNewestByDate } from "../utils";

export function normalizePlugin(state: State): Promise<State> {
  const byId: { [key: string]: Article[] } = {};
  state.articles.forEach((article) => {
    byId[article.id] = byId[article.id] ?? [];
    byId[article.id].push(article);
  });

  return Promise.resolve({
    ...state,
    articles: Object.keys(byId).map((id) => {
      const articles = byId[id];
      if (articles.length === 1) {
        return articles[0];
      }

      return merge(articles);
    }),
  });
}

function merge(articles: Article[]): Article {
  articles.sort(oldestToNewestByDate);
  articles.reverse();

  const result = { ...articles[0] };
  for (let i = 1; i < articles.length; i++) {
    Object.keys(articles[i]).forEach((key) => {
      // @ts-ignore
      result[key] = result[key] ?? articles[i][key];
    });
  }
  return result;
}
