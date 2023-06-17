import { Article, Logger, Plugin, State } from "../types";
import { formatRelative } from "date-fns";
import { ContextBlock, KnownBlock, WebClient } from "@slack/web-api";
import { augmentArticle, oldestToNewestByDate } from "../utils";

type SlackPluginOptions = {
  channel: string;
  logger: Logger;
  token: string;
};

export function slackPlugin({
  channel,
  logger,
  token,
}: SlackPluginOptions): Plugin {
  const client = new WebClient(token);

  return async (state: State): Promise<State> => {
    const oldestToNewest = [...state.articles].sort(oldestToNewestByDate);

    const postedArticles = await oldestToNewest.reduce<Promise<Article[]>>(
      (promise, article) =>
        promise.then(async (postedArticles) => {
          if (article.metadata?.postedToSlackAt) {
            logger.debug(
              "Slack: Not posting %s (already posted at %s)",
              article.id,
              article.metadata.postedToSlackAt
            );
            postedArticles.push(article);
            return postedArticles;
          }

          if (!article.summary) {
            logger.debug("Slack: Not posting %s (no summary)", article.id);
            postedArticles.push(article);
            return postedArticles;
          }

          const blocks = articleToBlocks(article);

          await client.chat.postMessage({
            channel,
            text: article.nonClickbaitTitle ?? article.title,
            // @ts-ignore
            blocks: blocks,
            unfurl_links: false,
          });

          postedArticles.push(
            augmentArticle(
              article,
              {},
              {
                postedToSlackAt: new Date().toISOString(),
              }
            )
          );

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
        text: `*${article.nonClickbaitTitle ?? article.title}*`,
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

  if (
    article.nonClickbaitTitle &&
    article.nonClickbaitTitle !== article.title
  ) {
    context.elements.push({
      type: "plain_text",
      text: `Original title: ${article.title}`,
    });
  }

  context.elements.push({
    type: "mrkdwn",
    text: `<${article.url}|View original>`,
  });

  blocks.push(context);

  return blocks;
}
