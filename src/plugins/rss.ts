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
        title: article.nonClickbaitTitle ?? article.title,
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
  const content = article.content?.html ?? article.summary;

  if (!content) {
    return;
  }

  let preamble: string[] = [];

  if (article.isLocal === false) {
    preamble.push(
      '<font color="red">This does not look like local news</font>'
    );
  }

  if (
    article.nonClickbaitTitle &&
    article.nonClickbaitTitle.trim() !== article.title.trim()
  ) {
    preamble.push(`<em>Original title: ${article.title}</em>`);
  }

  if (article.content && article.summary) {
    preamble.push(article.summary);
  }

  return ["<blockquote>", preamble.join("<br><br>"), "</blockquote>", content]
    .filter(Boolean)
    .join("\n");
}

function shouldAddToFeed(article: Article): boolean {
  // Don't add things w/o summary or content to the feed
  return !!(article.summary || article.content);
}
