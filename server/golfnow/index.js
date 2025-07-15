import { fetchGolfNowTeeTimes, parseTeeTimes } from './fetchTeeTimes.js';

const searchDate = '2025-07-17';
const lat = 28.53834;      // Orlando
const lon = -81.37923;

const data = await fetchGolfNowTeeTimes({ date: searchDate, lat, lon });

console.log('✔️ Got', data.ttResults.facilities.length, 'facilities');

const teeTimes = parseTeeTimes(data.ttResults.facilities);

console.log('🏌️ Final Parsed Tee Times:', teeTimes);