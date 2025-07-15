import puppeteer from 'puppeteer-core';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();

puppeteerExtra.use(StealthPlugin());
puppeteerExtra.puppeteer = puppeteer;

export async function getCsrfToken() {
  const browser = await puppeteerExtra.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  const searchPageUrl = 'https://www.golfnow.com/tee-times/search?startDate=2025-07-17&players=2&lat=28.53834&lon=-81.37923&radius=20';
  await page.goto(searchPageUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  const token = await page.evaluate(() => {
    const input = document.querySelector('input[name="__RequestVerificationToken"]');
    return input?.value || null;
  });

  await browser.close();

  if (!token) throw new Error('❌ CSRF token not found.');
  return token;
}