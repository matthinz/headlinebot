import { Article, Plugin, State } from "../types";
import { formatRelative } from "date-fns";
import { KnownBlock, WebClient } from "@slack/web-api";
import { oldestToNewestByDate } from "../utils";

type SlackPluginOptions = {
  channel: string;
  token: string;
};

export function slackPlugin({ channel, token }: SlackPluginOptions): Plugin {
  const client = new WebClient(token);

  return async (state: State): Promise<State> => {
    const oldestToNewest = await [...state.articles]
      .sort(oldestToNewestByDate)
      .reduce<Promise<Article[]>>(
        (promise, article) =>
          promise.then(async (result) => {
            if (article.metadata?.postedToSlackAt) {
              console.error(
                "Not posting %s -- posted to slack at %s",
                article.id,
                article.metadata.postedToSlackAt
              );
              result.push(article);
              return result;
            }

            await client.chat.postMessage({
              channel,
              text: article.title,
              // @ts-ignore
              blocks: articleToBlocks(article),
              unfurl_links: false,
            });

            result.push({
              ...article,
              metadata: {
                ...(article?.metadata ?? {}),
                postedToSlackAt: new Date().toISOString(),
              },
            });

            return result;
          }),
        Promise.resolve([])
      );

    return {
      ...state,
      articles: state.articles
        .map(({ id }) => oldestToNewest.find((a) => a.id === id))
        .filter(Boolean) as Article[],
    };
  };
}

function articleToBlocks(article: Article): KnownBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${article.title}*`,
      },
    },
    (article.date || article.author) && {
      type: "context",
      elements: [
        article.date && {
          type: "plain_text",
          text: formatRelative(article.date, new Date()),
        },
        article.author && {
          type: "plain_text",
          text: article.author,
        },
      ].filter(Boolean) as KnownBlock[],
    },
    article.summary && {
      type: "section",
      text: {
        type: "plain_text",
        text: article.summary,
        emoji: false,
      },
    },
  ].filter(Boolean) as KnownBlock[];
}
