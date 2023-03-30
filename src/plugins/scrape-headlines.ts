import cheerio from "cheerio";
import { Browser, launchBrowser } from "../browser";
import { ArticleSchema } from "../schema";
import { Article, Logger, Scraper, State } from "../types";

export type ScrapeHeadlinesOptions = {
  url: URL;
  browser: Browser;
  logger: Logger;
};

type FilterContext = {
  scrapeUrl: URL;
};

type Filter = (article: Article, context: FilterContext) => boolean;

const SCRAPERS: Scraper[] = [
  {
    key: "id",
    selector: "h3 a",
    reader: ($el) => {
      const href = $el.attr("href");
      if (!href) {
        return;
      }
      try {
        const url = new URL(href.trim());
        url.hash = "";
        return url.toString().toLowerCase();
      } catch {}
    },
  },
  {
    key: "url",
    selector: "h3 a",
    reader: ($el) => {
      const href = $el.attr("href");
      if (!href) {
        return;
      }
      try {
        const url = new URL(href.trim());
        url.hash = "";
        return url.toString();
      } catch {}
    },
  },
  {
    key: "title",
    selector: "h3",
    reader: ($el) => $el.text().trim(),
  },
  {
    key: "date",
    selector: "div[datetime]",
    reader: ($el) => {
      const raw = $el.attr("datetime");
      if (raw) {
        const timestamp = parseInt(raw, 10);
        if (!isNaN(timestamp)) {
          return new Date(timestamp * 1000);
        }
      }
    },
  },
  {
    key: "image",
    selector: "figure img",
    reader: ($el) => {
      let src: URL;
      let alt: string;

      try {
        src = new URL($el.attr("src") ?? "");
      } catch {
        return;
      }

      return {
        src: src.toString(),
        alt: $el.attr("alt") ?? "",
      };
    },
  },
];

const FILTERS: Filter[] = [
  function onlySameHostAllowed(article, { scrapeUrl }) {
    return new URL(article.url).host === scrapeUrl.host;
  },
];

export function scrapeHeadlinesPlugin({
  url,
  browser,
  logger,
}: ScrapeHeadlinesOptions): (state: State) => Promise<State> {
  return async (state: State) => {
    const html = await browser.get(url, logger);

    const $ = cheerio.load(html);

    const filterContext = {
      scrapeUrl: url,
    };

    const scrapedHeadlines = scrapeHeadlines($).filter((article) =>
      FILTERS.every((filter) => filter(article, filterContext))
    );

    return {
      ...state,
      articles: [...state.articles, ...scrapedHeadlines],
    };
  };
}

function scrapeHeadlines($: cheerio.Root): Article[] {
  const result: Article[] = [];

  $("article").each((_, articleEl) => {
    const $article = $(articleEl);

    const raw: Record<string, unknown> = {};

    SCRAPERS.forEach(({ key, selector, reader }) => {
      const $el = $article.find(selector);
      const value = reader($el);
      if (value != null) {
        raw[key] = value;
      }
    });

    const parsed = ArticleSchema.safeParse(raw);
    if (parsed.success) {
      result.push(parsed.data);
    } else {
      console.error(raw);
      console.error(parsed.error);
    }
  });

  return result;
}
