const puppeteer = require('puppeteer-core');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

puppeteerExtra.use(StealthPlugin());
puppeteerExtra.puppeteer = puppeteer; // ← Patch core into extra

async function scrapeTeeTimes({ date, players, lat, lon }) {
  const browser = await puppeteerExtra.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  const url = `https://www.golfnow.com/tee-times/search?startDate=${date}&players=${players}&lat=${lat}&lon=${lon}&radius=20`;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.screenshot({ path: 'debug.png' }); // Debug visual

    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 30000 });

    const teeTimes = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="search-result"]');
      return Array.from(cards).map(card => {
        const course = card.querySelector('[data-testid="facility-name"]')?.textContent.trim();
        const time = card.querySelector('[data-testid="tee-time"]')?.textContent.trim();
        const price = card.querySelector('[data-testid="display-amount"]')?.textContent.trim();
        const holes = card.querySelector('[data-testid="hole-count"]')?.textContent.trim();
        const bookingUrl = card.querySelector('a[href*="/tee-times/facility"]')?.href;
        return { course, time, price, holes, bookingUrl };
      });
    });

    await browser.close();
    return teeTimes;
  } catch (err) {
    console.error('❌ Scraper failed. Dumping HTML...');

    const html = await page.content();
    console.log(html.slice(0, 1500));

    await page.screenshot({ path: 'error.png' });
    await browser.close();
    throw err;
  }
}

module.exports = scrapeTeeTimes;