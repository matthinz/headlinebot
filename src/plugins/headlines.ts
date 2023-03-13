import { Page } from "puppeteer";
import { launchBrowser } from "../browser";
import { Article } from "../types";

export async function scrapeHeadlinesPlugin(
  articles: Article[]
): Promise<Article[]> {
  const browser = await launchBrowser();

  const scrapedArticles = await browser.usePage(async (page) => {
    await page.goto(process.env.SCRAPE_URL);
    return await scrapeArticles(page);
  });

  await browser.close();

  return [...articles, ...scrapedArticles];
}

async function scrapeArticles(page: Page): Promise<Article[]> {
  return page
    .evaluate(() =>
      [].map.call(
        document.querySelectorAll("article"),
        (article: HTMLElement) => {
          const isAd = article.innerText.includes("SPONSORED CONTENT");
          if (isAd) {
            return;
          }

          // @ts-ignore
          const isHidden = !article.checkVisibility();
          if (isHidden) {
            return;
          }

          const title = article.querySelector("h3")?.textContent?.trim();
          if (!title) {
            return;
          }

          const url = article.querySelector<HTMLAnchorElement>("h3 a")?.href;
          if (!url) {
            return;
          }

          const rawDate = article
            .querySelector("div[datetime]")
            ?.getAttribute("datetime");

          const date = rawDate
            ? new Date(parseInt(rawDate, 10) * 1000).toISOString()
            : undefined;

          let image;
          const img = article.querySelector<HTMLImageElement>("figure img");
          if (img) {
            image = {
              src: img.src,
              alt: img.alt,
            };
          }

          return {
            id: url,
            title,
            url,
            date,
            image,
            metadata: {},
          };
        }
      )
    )
    .then((stories) => stories.filter(Boolean) as Article[]); // TODO: Ditch as Article[]
}
