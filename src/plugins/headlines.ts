import fs from "node:fs/promises";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Article } from "../types";

puppeteer.use(stealthPlugin());

export async function scrapeHeadlinesPlugin(
  articles: Article[]
): Promise<Article[]> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: process.env.CHROME_PATH,
  });

  const page = await browser.newPage();

  page.emulateTimezone("America/Los_Angeles");

  page.on("console", (message) => console.error("BROWSER: %s", message.text()));

  await restoreCookies(page);

  await page.goto(process.env.SCRAPE_URL);

  const scrapedArticles = await scrapeArticles(page);

  await saveCookies(page);

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
          };
        }
      )
    )
    .then((stories) => stories.filter(Boolean) as Article[]);
}

async function restoreCookies(page: Page, cookiesFile = ".cookies.json") {
  let cookies;

  try {
    cookies = JSON.parse(await fs.readFile(cookiesFile, "utf-8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  await page.setCookie(...cookies);
}

async function saveCookies(page: Page, cookiesFile = ".cookies.json") {
  const cookies = await page.cookies();
  await fs.writeFile(cookiesFile, JSON.stringify(cookies, null, 2));
}

async function logInIfNeeded(page: Page) {
  await page.waitForNetworkIdle();
  const username = process.env["WEBSITE_USERNAME"] ?? "";
  const password = process.env["WEBSITE_PASSWORD"] ?? "";
  await page.waitForSelector("input[name=email]", { timeout: 10000 });
  await page.focus("input[name=email]");
  await delay(Math.random() * 500);
  await page.type("input[name=email]", username, {
    delay: Math.random() * 100,
  });
  await page.focus("input[name=password]");
  await delay(Math.random() * 500);
  await page.type("input[name=password]", password, {
    delay: Math.random() * 100,
  });
  await page.click("button[type=submit]");
  await page.waitForNavigation();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
