import { Browser as PuppeteerBrowser, Page } from "puppeteer";
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
  let browserPromise: Promise<PuppeteerBrowser> | undefined;

  const blockedHosts = new Set<string>();

  return { close, get };

  function getPage(): Promise<Page> {
    browserPromise =
      browserPromise ??
      puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: process.env.CHROME_PATH,
      });

    return browserPromise.then(async (browser) => {
      const page = await browser.newPage();

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

      return page;
    });
  }

  async function close() {
    if (!browserPromise) {
      return;
    }
    const browser = await browserPromise;
    browserPromise = undefined;
    await browser.close();
  }

  async function get(url: string | URL): Promise<string> {
    const page = await getPage();

    await page.goto(url.toString());

    await onPageLoad(page);

    const result = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    await page.close();

    return result;
  }

  function shouldBlockRequest(requestUrl: URL): boolean {
    return !allowedHosts.includes(requestUrl.hostname);
  }
}
