import fs from "node:fs/promises";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Logger } from "./types";

puppeteer.use(stealthPlugin());

export type BrowserOptions = {
  allowedHosts: string[];
  logger: Logger;
  onPageLoad(page: Page): Promise<void>;
};

export type Browser = {
  close(): Promise<void>;
  get(url: string | URL): Promise<string>;
};

export async function launchBrowser({
  allowedHosts,
  logger,
  onPageLoad,
}: BrowserOptions): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: process.env.CHROME_PATH,
  });

  const page = (await browser.pages())[0] ?? (await browser.newPage());

  const blockedHosts = new Set<string>();

  page.emulateTimezone("America/Los_Angeles");

  page.setRequestInterception(true);

  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (shouldBlockRequest(requestUrl)) {
      if (!blockedHosts.has(requestUrl.hostname)) {
        logger.debug("Blocking request to %s", requestUrl.hostname);
        blockedHosts.add(requestUrl.hostname);
      }

      request.abort();
    } else {
      request.continue();
    }
  });

  await restoreCookies(page);

  return { close, get };

  async function close() {
    await saveCookies(page);
    await browser.close();
  }

  async function get(url: string | URL): Promise<string> {
    await page.goto(url.toString());

    await onPageLoad(page);

    return await page.evaluate(() => document.documentElement.outerHTML);
  }

  function shouldBlockRequest(requestUrl: URL): boolean {
    return !allowedHosts.includes(requestUrl.hostname);
  }
}

async function restoreCookies(page: Page, cookiesFile = ".cookies.json") {
  let cookies;

  try {
    cookies = JSON.parse(await fs.readFile(cookiesFile, "utf-8"));
  } catch (err: any) {
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
