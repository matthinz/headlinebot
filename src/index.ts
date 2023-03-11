import { config } from "dotenv";
import { Article, Plugin } from "./types";
import { loadPlugin, savePlugin } from "./plugins/load";
import { scrapeHeadlinesPlugin } from "./plugins/headlines";
import { printPlugin } from "./plugins/print";
import { dedupePlugin } from "./plugins/dedupe";
import { slackPlugin } from "./plugins/slack";

const PLUGINS: Plugin[] = [
  loadPlugin,
  scrapeHeadlinesPlugin,
  dedupePlugin,
  // slackPlugin,
  printPlugin,
  savePlugin,
];

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

function run() {
  config();

  return PLUGINS.reduce(
    (promise, plugin) =>
      promise.then((articles: Article[]) => plugin(articles)),
    Promise.resolve([])
  );
}
