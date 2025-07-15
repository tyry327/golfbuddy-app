// golfnow/fetchTeeTimes.js
import fetch from 'node-fetch';

/**
 * Extracts individual tee times from the facilities array.
 */
export function parseTeeTimes(facilities) {
  const teeTimes = [];

  for (const facility of facilities) {
    const baseInfo = {
      courseName: facility.name,
      address: `${facility.address.line1}, ${facility.address.city}, ${facility.address.stateProvinceCode}`,
      minPrice: facility.minPriceFormatted,
      maxPrice: facility.maxPriceFormatted,
      image: facility.thumbnailImagePath,
    };

    // Attempt to pull tee times from potential fields
    const rawTeeTimes =
      facility.teeTimes ||
      facility.hotDeals ||
      facility.promotedCampaignTeeTimes ||
      [];

    if (Array.isArray(rawTeeTimes) && rawTeeTimes.length > 0) {
      for (const teeTime of rawTeeTimes) {
        teeTimes.push({
          ...baseInfo,
          time: teeTime.teeTime || teeTime.formattedTime || facility.minDateFormatted,
          price: teeTime.displayAmount || teeTime.rate || facility.minPriceFormatted,
          holes: teeTime.holes || '18',
          bookingUrl: `https://www.golfnow.com${teeTime.teeTimeBookingUrl || ''}`,
        });
      }
    } else {
      // fallback: just push one generic listing if no slots are found
      teeTimes.push({
        ...baseInfo,
        time: `${facility.minDateFormatted} – ${facility.maxDateFormatted}`,
        price: `${facility.minPriceFormatted} – ${facility.maxPriceFormatted}`,
        holes: 'N/A',
        bookingUrl: `https://www.golfnow.com/tee-times/facility/${facility.seoFriendlyName}`,
      });
    }
  }

  return teeTimes;
}

/**
 * Makes a POST request to the GolfNow API to fetch tee time data.
 */
export async function fetchGolfNowTeeTimes({ date, lat, lon, players = 2 }) {
  const res = await fetch('https://www.golfnow.com/api/tee-times/tee-time-results', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'x-requested-with': 'XMLHttpRequest',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json; charset=UTF-8',
      referer: `https://www.golfnow.com/tee-times/search?startDate=${date}&players=${players}&lat=${lat}&lon=${lon}&radius=20`,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      Radius: 20,
      Latitude: lat,
      Longitude: lon,
      PageSize: 30,
      PageNumber: 0,
      SearchType: 0,
      SortBy: 'Facilities.Distance',
      SortDirection: 0,
      Date: date,
      PriceMin: 0,
      PriceMax: 10000,
      Players: players,
      Holes: 3,
      FacilityType: 0,
      RateType: 'all',
      TimeMin: 10,
      TimeMax: 42,
      SortByRollup: 'Facilities.Distance',
      View: 'Course',
      ExcludeFeaturedFacilities: false,
      TeeTimeCount: 15,
      CurrentClientDate: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`❌ Failed to fetch tee times: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}