import { config } from "dotenv";
import { scrapeArticlesPlugin } from "./plugins/scrape-articles";
import { loadPlugin } from "./plugins/load";
import { savePlugin } from "./plugins/save";
import { scrapeHeadlinesPlugin } from "./plugins/scrape-headlines";
import { Plugin, State } from "./types";
import { launchBrowser } from "./browser";
import { Page } from "puppeteer";
import { createConsoleLogger } from "./logger";
import { delay } from "./utils";
import { normalizePlugin } from "./plugins/normalize";
import { summarizePlugin } from "./plugins/summarize";
import { slackPlugin } from "./plugins/slack";

run(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

async function run(args: string[]) {
  config();

  const logger = createConsoleLogger({
    verbose: !!process.env.VERBOSE || args.includes("--verbose"),
  });

  const headlinesUrl = new URL(process.env.HEADLINES_URL ?? "");

  const browser = await launchBrowser({
    allowedHosts: [
      headlinesUrl.hostname,
      ...(process.env.ALLOWED_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
    ],
    logger,
    onPageLoad: handlePageLoad,
  });

  const shouldScrapeHeadlines = !args.includes("--no-scrape");

  const plugins = [
    loadPlugin,
    shouldScrapeHeadlines &&
      scrapeHeadlinesPlugin({
        browser,
        url: headlinesUrl,
      }),
    normalizePlugin,
    scrapeArticlesPlugin({
      browser,
      logger,
    }),
    summarizePlugin({ logger }),
    savePlugin,
  ].filter(Boolean) as Plugin[];

  if (process.env.SLACK_CHANNEL && process.env.SLACK_TOKEN) {
    plugins.push(
      slackPlugin({
        channel: process.env.SLACK_CHANNEL,
        token: process.env.SLACK_TOKEN,
      })
    );
  }

  const initialState: State = {
    articles: [],
    cache: [],
  };

  const state = await executePipeline(plugins, initialState);

  await browser.close();

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
}

async function handlePageLoad(page: Page): Promise<void> {
  const isPaywall = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>(".page-title");
    return title?.innerText?.trim() === "Subscribe to continue reading";
  });

  if (!isPaywall) {
    return;
  }

  // Find the login link and click it
  await page.click("#account-signin-btn");

  const username = process.env["WEBSITE_USERNAME"] ?? "";
  const password = process.env["WEBSITE_PASSWORD"] ?? "";

  await page.waitForSelector("input[name=email]");
  await delay(1000, 3000);

  await page.focus("input[name=email]");
  await delay(500, 1000);
  await page.type("input[name=email]", username, {
    delay: Math.random() * 100,
  });
  await page.focus("input[name=password]");
  await delay(500, 1000);
  await page.type("input[name=password]", password, {
    delay: Math.random() * 100,
  });
  await page.click("button[type=submit]");
  await page.waitForNavigation();
}
