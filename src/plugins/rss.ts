import { Feed } from "feed";
import { Article, Plugin, State } from "../types";

export function rssPlugin(): Plugin {
  return async (state: State): Promise<State> => {
    const feed = new Feed({
      id: "test",
      title: "test",
      copyright: "",
    });

    state.articles.filter(shouldAddToFeed).forEach((article) => {
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
  let preamble: string[] = [];

  if (
    article.nonClickbaitTitle &&
    article.nonClickbaitTitle.trim() !== article.title.trim()
  ) {
    console.error("%s\n%s", article.title, article.nonClickbaitTitle);
    preamble.push(`<em>Original title: ${article.title}</em>`);
  }

  if (article.content && article.summary) {
    preamble.push(article.summary);
  }

  const content = article.content?.html ?? article.summary;

  if (!content) {
    return;
  }

  return ["<blockquote>", preamble.join("<br><br>"), "</blockquote>", content]
    .filter(Boolean)
    .join("\n");
}

function shouldAddToFeed(article: Article): boolean {
  // Don't add things w/o summary or content to the feed
  return !!(article.summary || article.content);
}
