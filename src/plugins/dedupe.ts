import { Article } from "../types";

export function dedupePlugin(articles: Article[]): Promise<Article[]> {
  const byId: { [key: string]: Article[] } = {};
  articles.forEach((article) => {
    byId[article.id] = byId[article.id] ?? [];
    byId[article.id].push(article);
  });

  return Promise.resolve(
    Object.keys(byId).map((id) => {
      const articles = byId[id];
      if (articles.length === 1) {
        return articles[0];
      }

      return merge(articles);
    })
  );
}

function merge(articles: Article[]): Article {
  articles.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else if (a.date > b.date) {
      return -1;
    } else {
      return 0;
    }
  });

  const result = { ...articles[0] };
  for (let i = 1; i < articles.length; i++) {
    Object.keys(articles[i]).forEach((key) => {
      result[key] = result[key] ?? articles[i][key];
    });
  }
  return result;
}
