import prettier from "prettier";
import cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { Browser } from "../browser";
import { ArticleSchema } from "../schema";
import {
  Article,
  Logger,
  Plugin,
  RequestedDocument,
  Scraper,
  State,
  TextContent,
} from "../types";

export type ScrapeArticlesPluginOptions = {
  browser: Browser;
  logger: Logger;
};

const REMOVE_SELECTORS = ["header", "footer", "figure"];

const SCRAPERS: Scraper[] = [
  {
    key: "content",
    selector: "article.story-body",
    reader: scrapeTextContent,
  },
  {
    key: "author",
    selector: "article.story-body .byline",
    reader($el) {
      let names = ($el.text() ?? "")
        .split("\n")
        .map((str) => str.trim())
        .filter(Boolean)
        .map((name) => name.replace(/^By\s*/i, ""));

      if (names.length === 0) {
        return;
      }

      const uniqueNames = names.reduce((set, name) => {
        set.add(name);
        return set;
      }, new Set<string>());

      return Array.from(uniqueNames).join(", ");
    },
  },
];

export function scrapeArticlesPlugin({
  browser,
  logger,
}: ScrapeArticlesPluginOptions): Plugin {
  return async (state: State): Promise<State> => {
    let nextCache: RequestedDocument[] | undefined;

    const promise = state.articles.reduce<Promise<Article[]>>(
      (promise, article) =>
        promise.then(async (articles) => {
          let html: string;

          let cacheEntry = state.cache.find(
            (d) => d.url === article.url.toString()
          );
          if (cacheEntry) {
            logger.debug("Loading %s from cache", article.url.toString());
            html = cacheEntry.body;
          } else {
            html = await browser.get(article.url);
            nextCache = nextCache ?? [...state.cache];
            nextCache.push({
              date: new Date(),
              url: article.url.toString(),
              body: html,
            });
          }

          const full = scrapeArticle(article, html);

          if (full) {
            articles.push(full);
          } else {
            articles.push(article);
          }

          return articles;
        }),
      Promise.resolve([])
    );

    return {
      ...state,
      articles: await promise,
      cache: nextCache ?? state.cache,
    };
  };
}

function scrapeArticle(article: Article, html: string): Article | undefined {
  const $ = cheerio.load(html);
  const raw = SCRAPERS.reduce<Record<string, unknown>>(
    (raw, { key, selector, reader }) => {
      const $el = $(selector);
      const value = reader($el);
      if (value != null) {
        raw[key] = value;
      }
      return raw;
    },
    {
      ...article,
    }
  );

  const parsed = ArticleSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  } else {
    console.error(raw);
    console.error(parsed.error);
  }
}

function scrapeTextContent($el: cheerio.Cheerio): TextContent | undefined {
  REMOVE_SELECTORS.forEach((selector) => {
    $el.find(selector).remove();
  });

  const rawHtml = ($el.html() ?? "").trim();

  if (rawHtml === "") {
    return;
  }

  const html = cleanHtml(rawHtml);

  const text = htmlToPlainText(html);

  return { html, text };
}

export function cleanHtml(html: string): string {
  return [
    (html: string) => sanitizeHtml(html),
    (html: string) => prettier.format(html, { parser: "html" }),
  ].reduce((html, formatter) => formatter(html), html);
}

export function htmlToPlainText(html: string): string {
  return [
    (html: string) => sanitizeHtml(html, { allowedTags: [] }),
    (text: string) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .join("\n"),
    (text: string) => text.replace(/\n{2,}/g, "\n\n"),
    (text: string) => text.trim(),
  ].reduce((text, formatter) => formatter(text), html);
}
