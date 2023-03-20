import { Feed } from "feed";
import { Plugin, State } from "../types";

export function rssPlugin(): Plugin {
  return async (state: State): Promise<State> => {
    const feed = new Feed({
      id: "test",
      title: "test",
      copyright: "",
    });

    state.articles.forEach((article) => {
      feed.addItem({
        date: article.date ?? new Date(),
        link: article.url,
        title: article.title,
        description: article.summary,
        id: article.id,
        content: article.content?.html ?? article.summary,
      });
    });

    return {
      ...state,
      artifacts: [
        ...(state.artifacts ?? []),
        {
          name: "articles.xml",
          contentType: "text/xml",
          content: feed.rss2(),
          isPublic: true,
        },
      ],
    };
  };
}
