import fs from "node:fs/promises";
import sanitizeHtml from "sanitize-html";
import { Page } from "puppeteer";
import { launchBrowser } from "../browser";
import { Article } from "../types";
import { delay } from "../utils";

export async function scrapeFullStoriesPlugin(
  articles: Article[]
): Promise<Article[]> {
  const browser = await launchBrowser();

  const result = await articles.reduce<Promise<Article[]>>(
    (promise, article) =>
      promise.then(async (result) => {
        if (!article.content) {
          const { author, content } = await browser.open(article.url, (page) =>
            scrapeArticle(article, page)
          );
          article = {
            ...article,
            author,
            content,
          };
        }

        const newArticle = {
          ...article,

          content: sanitizeHtml(article.content),
        };

        if (article.author) {
          newArticle.author = sanitizeHtml(article.author, {
            allowedTags: [],
          });
        }

        result.push(newArticle);

        return result;
      }),
    Promise.resolve([])
  );

  await browser.close();

  return result;
}

function cleanHtml(content: string): string {
  return sanitizeHtml(content);
}

async function scrapeArticle(
  article: Article,
  page: Page
): Promise<{ author?: string; content: string }> {
  console.error("Scraping %s", article.id);
  await delay(Math.random() * 3000);

  return await page.evaluate(() => {
    const article = document.querySelector("article.story-body");
    const content = article.innerHTML;

    const author = (
      document.querySelector("article.story-body .byline a").innerHTML ?? ""
    ).replace(/^By\s*/i, "");

    return { author, content };
  });
}
