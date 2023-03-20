import { Feed } from "feed";
import { Article, Plugin, State } from "../types";

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
        content: buildContent(article),
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

function buildContent(article: Article): string | undefined {
  if (article.content && article.summary) {
    return [
      "<blockquote>",
      article.summary,
      "</blockquote>",
      article.content.html,
    ].join("\n");
  } else if (article.content) {
    return article.content.html;
  } else if (article.summary) {
    return article.summary;
  }
}
