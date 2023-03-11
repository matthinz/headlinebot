import fs from "node:fs/promises";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { delay } from "./utils";

puppeteer.use(stealthPlugin());

type Browser = {
  close(): Promise<void>;
  open<T>(url: string, func: (page: Page) => Promise<T>): Promise<T>;
  usePage<T>(func: (page: Page) => Promise<T>): Promise<T>;
};

export async function launchBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: process.env.CHROME_PATH,
  });

  const page = (await browser.pages())[0] ?? (await browser.newPage());

  page.emulateTimezone("America/Los_Angeles");

  // page.on("console", (message) => console.error("BROWSER: %s", message.text()));

  await restoreCookies(page);

  return { close, open, usePage };

  async function close() {
    await saveCookies(page);
    await browser.close();
  }

  function open<T>(url: string, func: (page: Page) => Promise<T>): Promise<T> {
    return usePage(async (page) => {
      await page.goto(url);
      console.error("Navigated to %s.", url);

      const toDelay = 3000 + Math.random() * 5000;
      console.error("Delaying %ds", toDelay / 1000);

      await delay(3000 + Math.random() * 5000);

      await logInIfNeeded(page);

      return await func(page);
    });
  }

  function usePage<T>(func: (page: Page) => Promise<T>): Promise<T> {
    return func(page);
  }
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
  // Look for paywall
  const isPaywall = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>(".page-title");
    return title?.innerText?.trim() === "Subscribe to continue reading";
  });

  if (!isPaywall) {
    return;
  }

  // Find the login link and click it
  await page.click("#account-signin-btn");
  await page.waitForNavigation();

  const username = process.env["WEBSITE_USERNAME"] ?? "";
  const password = process.env["WEBSITE_PASSWORD"] ?? "";

  await page.waitForSelector("input[name=email]");
  await delay(1000);

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
