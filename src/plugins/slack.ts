import { Article } from "../types";
import { formatRelative } from "date-fns";
import { WebClient } from "@slack/web-api";

export async function slackPlugin(articles: Article[]): Promise<Article[]> {
  const client = new WebClient(process.env.SLACK_TOKEN);

  const oldestToNewest = [...articles];
  oldestToNewest.sort((a, b) => {
    if (a.date < b.date) {
      return -1;
    } else if (a.date > b.date) {
      return 1;
    } else {
      return 0;
    }
  });

  await oldestToNewest.reduce(
    (promise, article) =>
      promise.then(async () => {
        if (article.metadata.postedToSlackAt) {
          console.error(
            "Not posting %s -- posted to slack at %s",
            article.id,
            article.metadata.postedToSlackAt
          );
          return;
        }

        await client.chat.postMessage({
          channel: process.env.SLACK_CHANNEL,
          text: article.title,
          blocks: articleToBlocks(article),
          unfurl_links: false,
        });

        article.metadata.postedToSlackAt = new Date().toISOString();
      }),
    Promise.resolve()
  );

  return articles;
}

function articleToBlocks(article: Article) {
  return [
    article.image && {
      type: "image",
      image_url: article.image.src,
      alt_text: article.image.alt,
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${article.url}|${article.title}>*`,
      },
    },
    article.summary && {
      type: "section",
      text: {
        type: "plain_text",
        text: article.summary,
        emoji: false,
      },
    },
    (article.date || article.author) && {
      type: "context",
      elements: [
        article.author && {
          type: "plain_text",
          text: article.author,
        },

        article.date && {
          type: "plain_text",
          text: formatRelative(article.date, new Date()),
        },
      ].filter(Boolean),
    },
  ].filter(Boolean);
}

function formatMessage(article: Article): string {
  return [].join("\n");
}
