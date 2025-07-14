const express = require('express');
const cors = require('cors');
require('dotenv').config();

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/tee-times', async (req, res) => {
  const { date, players, timeOfDay, lat, lon } = req.query;

  if (!date || !players || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  const baseUrl = 'https://golf-api.gnsvc.com/api/search/searchteetimes';
  const params = new URLSearchParams({
    teeOffStartDate: date,
    teeOffEndDate: date,
    numberOfPlayers: players,
    sortBy: 'PriceLowToHigh',
    latitude: lat,
    longitude: lon,
    radius: '20',
    timeOfDay: timeOfDay || 'morning',
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'GolfBuddyApp/1.0',
        'Accept': 'application/json',
        'Origin': 'https://www.golfnow.com',
        'Referer': 'https://www.golfnow.com/',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch tee times' });
    }

    const data = await response.json();

    const formatted = data.teeTimes?.map(tt => ({
      course: tt.facility?.name,
      time: tt.teeTime,
      price: tt.displayAmount,
      holes: tt.holeCount,
      players: tt.numberOfPlayers,
      bookingUrl: tt.teeTimeBookingUrl,
    })) || [];

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching tee times:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
