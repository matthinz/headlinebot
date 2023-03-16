import { Article, Plugin, State } from "../types";
import { formatRelative } from "date-fns";
import { ContextBlock, KnownBlock, WebClient } from "@slack/web-api";
import { oldestToNewestByDate } from "../utils";

type SlackPluginOptions = {
  channel: string;
  token: string;
};

export function slackPlugin({ channel, token }: SlackPluginOptions): Plugin {
  const client = new WebClient(token);

  return async (state: State): Promise<State> => {
    const oldestToNewest = [...state.articles].sort(oldestToNewestByDate);

    const postedArticles = await oldestToNewest.reduce<Promise<Article[]>>(
      (promise, article) =>
        promise.then(async (postedArticles) => {
          if (article.metadata?.postedToSlackAt) {
            console.error(
              "Not posting %s -- posted to slack at %s",
              article.id,
              article.metadata.postedToSlackAt
            );
            postedArticles.push(article);
            return postedArticles;
          }

          const blocks = articleToBlocks(article);

          await client.chat.postMessage({
            channel,
            text: article.title,
            // @ts-ignore
            blocks: blocks,
            unfurl_links: false,
          });

          postedArticles.push({
            ...article,
            metadata: {
              ...(article?.metadata ?? {}),
              postedToSlackAt: new Date().toISOString(),
            },
          });

          return postedArticles;
        }),
      Promise.resolve([])
    );

    return {
      ...state,
      articles: state.articles.map(({ id }) => {
        const article = postedArticles.find((a) => a.id === id);
        if (!article) {
          throw new Error(`Article with id ${id} not found.`);
        }
        return article;
      }),
    };
  };
}

function articleToBlocks(article: Article): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${article.title}*`,
      },
    },
  ];

  if (!article.summary) {
    return blocks;
  }

  blocks.push({
    type: "section",
    text: {
      type: "plain_text",
      text: article.summary,
      emoji: false,
    },
  });

  const context: ContextBlock = {
    type: "context",
    elements: [],
  };

  if (article.date) {
    context.elements.push({
      type: "plain_text",
      text: formatRelative(article.date, new Date()),
    });
  }

  if (article.author) {
    context.elements.push({
      type: "plain_text",
      text: article.author,
    });
  }

  context.elements.push({
    type: "mrkdwn",
    text: `<${article.url}|View original>`,
  });

  blocks.push(context);

  return blocks;
}
