#!/usr/bin/env node
import { config } from "dotenv";
import { Page } from "puppeteer";
import { createConsoleLogger } from "./logger";
import { countdown, delay } from "./utils";
import { scrape } from "./scrape";
import { add, formatDistanceToNow, formatRelative } from "date-fns";
import { loadStateFromSqlite } from "./plugins/state/sqlite";
import { summarizeArticle } from "./plugins/summarize";

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

  if (args[0] === "--list") {
    const stateFile = process.env.STATE_FILE ?? ".state.db";
    const state = await loadStateFromSqlite(stateFile);
    state.articles.forEach((article) => {
      console.log("%s (%s)", article.title, article.url);
    });
    return;
  }

  if (args[0] === "--summarize") {
    const url = args[1];
    const stateFile = process.env.STATE_FILE ?? ".state.db";
    const state = await loadStateFromSqlite(stateFile);
    const originalArticle = state.articles.find((a) => a.url === url);

    if (!originalArticle) {
      throw new Error("Article not found");
    }

    const article = await summarizeArticle(originalArticle, logger);

    console.log("Title:               %s", article.title);
    console.log("Non-clickbait title: %s", article.nonClickbaitTitle);
    console.log(
      "Is local:            %s",
      article.isLocal === true ? "yes" : article.isLocal === false ? "no" : "?"
    );
    console.log("Summary:\n%s", article.summary);

    return;
  }

  while (true) {
    const start = new Date();

    try {
      const result = await scrape({
        headlinesUrl,
        logger,
        onPageLoad: handlePageLoad,
        shouldScrapeHeadlines: !args.includes("--no-scrape"),
        stateFile: process.env.STATE_FILE ?? ".state.db",
        slackChannel: process.env.SLACK_CHANNEL,
        slackToken: process.env.SLACK_TOKEN,
      });

      const end = new Date();

      const duration = end.getTime() - start.getTime();

      logger.info(
        `Scraped ${result.newArticles.length} new article${
          result.newArticles.length === 1 ? "" : "s"
        } in ${duration / 1000}s${result.newArticles.length > 0 ? ":" : ""}`
      );
      result.newArticles.forEach((article) => {
        logger.info(`- ${article.title}`);
      });
    } catch (err: any) {
      logger.warn("Error during scrape");
      logger.warn(err);
    }

    const minSleep = 60 * 60 * 6;
    const maxSleep = 60 * 60 * 8;

    const timeOfNextScrape = add(new Date(), {
      seconds: minSleep + Math.random() * (maxSleep - minSleep),
    });

    await countdown(timeOfNextScrape, () => {
      logger.info(
        `Next scrape will be at ${formatRelative(
          timeOfNextScrape,
          new Date()
        )} (${formatDistanceToNow(timeOfNextScrape)})`
      );
    });
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
