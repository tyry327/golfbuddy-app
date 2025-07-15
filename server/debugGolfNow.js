import puppeteer from 'puppeteer-core';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();

puppeteerExtra.use(StealthPlugin());
puppeteerExtra.puppeteer = puppeteer;

async function getCsrfToken(page) {
  // Extract CSRF token from hidden input
  const token = await page.evaluate(() => {
    const input = document.querySelector('input[name="__RequestVerificationToken"]');
    if (input) return input.value;
    const meta = document.querySelector('meta[name="RequestVerificationToken"]');
    if (meta) return meta.content;
    return null;
  });
  return token;
}

async function fetchTeeTimes(token, params) {
  const url = 'https://www.golfnow.com/api/tee-times/tee-time-results';

  const formattedDate = new Date(params.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const body = JSON.stringify({
    Radius: params.radius || 20,
    Latitude: params.latitude.toString(),
    Longitude: params.longitude.toString(),
    PageSize: params.pageSize || 30,
    PageNumber: params.pageNumber || 0,
    SearchType: 0,
    SortBy: 'Facilities.Distance',
    SortDirection: 0,
    Date: formattedDate,
    PriceMin: 0,
    PriceMax: 10000,
    Players: params.players,
    Holes: params.holes || 3,
    FacilityType: 0,
    RateType: 'all',
    TimeMin: 10,
    TimeMax: 42,
    SortByRollup: 'Facilities.Distance',
    View: 'Course',
    ExcludeFeaturedFacilities: false,
    TeeTimeCount: 15,
    CurrentClientDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
  });

  const headers = {
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    __RequestVerificationToken: token,
    Referer: `https://www.golfnow.com/tee-times/search?startDate=${params.date}&players=${params.players}&lat=${params.latitude}&lon=${params.longitude}&radius=${params.radius || 20}`,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }

  return response.json();
}

(async () => {
  const browser = await puppeteerExtra.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36'
  );

  const searchPageUrl = 'https://www.golfnow.com/tee-times/search?startDate=2025-07-17&players=2&lat=28.53834&lon=-81.37923&radius=20';

  await page.goto(searchPageUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  const csrfToken = await getCsrfToken(page);

  if (!csrfToken) {
    console.error('Failed to find __RequestVerificationToken on page.');
    await browser.close();
    process.exit(1);
  }

  console.log('✔️ Extracted CSRF token:', csrfToken);

  await browser.close();

  try {
    const teeTimesData = await fetchTeeTimes(csrfToken, {
      latitude: 28.53834,
      longitude: -81.37923,
      date: '2025-07-17',
      players: 2,
      radius: 20,
    });

    console.log('🏌️‍♂️ Tee times data:', teeTimesData);
  } catch (err) {
    console.error('Error fetching tee times:', err);
  }
})();