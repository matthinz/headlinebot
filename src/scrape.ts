import { Page } from "puppeteer";
import { launchBrowser } from "./browser";
import { normalizePlugin } from "./plugins/normalize";
import { rssPlugin } from "./plugins/rss";
import { s3Plugin } from "./plugins/s3";
import { scrapeArticlesPlugin } from "./plugins/scrape-articles";
import { scrapeHeadlinesPlugin } from "./plugins/scrape-headlines";
import { slackPlugin } from "./plugins/slack";
import { loadPlugin, prunePlugin, savePlugin } from "./plugins/state";
import { summarizePlugin } from "./plugins/summarize";
import { Article, Logger, Plugin, State } from "./types";

export type ScrapeOptions = {
  headlinesUrl: URL;
  logger: Logger;
  onPageLoad: (page: Page) => Promise<void>;
  shouldScrapeHeadlines: boolean;
  slackChannel?: string | void;
  slackToken?: string | void;
  stateFile: string;
};

export type ScrapeResult = {
  newArticles: Article[];
};

export async function scrape({
  headlinesUrl,
  logger,
  shouldScrapeHeadlines,
  slackChannel,
  slackToken,
  stateFile,
  onPageLoad,
}: ScrapeOptions): Promise<ScrapeResult> {
  const browser = await launchBrowser({
    allowedHosts: [
      headlinesUrl.hostname,
      ...(process.env.ALLOWED_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
    ],
    logger,
    onPageLoad,
  });

  const initialState = await executePipeline(
    [loadPlugin({ file: stateFile, logger })],
    {
      articles: [],
      cache: [],
    }
  );

  const plugins = [
    shouldScrapeHeadlines &&
      scrapeHeadlinesPlugin({
        browser,
        logger,
        url: headlinesUrl,
      }),
    normalizePlugin,
    prunePlugin({
      logger,
      maxAgeInDays: 7,
    }),
    scrapeArticlesPlugin({
      browser,
      logger,
    }),
    summarizePlugin({ logger, maxArticleAgeInDays: 5 }),
    savePlugin({ file: stateFile, logger }),
    rssPlugin(),
  ].filter(Boolean) as Plugin[];

  if (slackChannel && slackToken) {
    plugins.push(
      slackPlugin({
        channel: slackChannel,
        logger,
        token: slackToken,
      }),
      savePlugin({
        file: stateFile,
        logger,
      })
    );
  }

  if (process.env.S3_BUCKET) {
    plugins.push(
      s3Plugin({
        bucket: process.env.S3_BUCKET,
        endpoint: process.env.S3_ENDPOINT,
        logger,
        region: process.env.S3_REGION,
      })
    );
  }

  const finalState = await executePipeline(plugins, initialState);

  await browser.close();

  const newArticles = finalState.articles.filter(
    (article) => !initialState.articles.find((a) => a.id === article.id)
  );

  return {
    newArticles,
  };
}

async function executePipeline(
  plugins: Plugin[],
  initialState: State
): Promise<State> {
  let state = initialState;
  const nextPlugins = [...plugins];

  return await next();

  async function next(newState?: State | void): Promise<State> {
    state = newState ? newState : state;

    while (nextPlugins.length > 0) {
      const plugin = nextPlugins.shift();
      if (!plugin) {
        continue;
      }

      const pluginResult = plugin(state, next);

      state =
        pluginResult instanceof Promise ? await pluginResult : pluginResult;
    }

    return state;
  }
}
