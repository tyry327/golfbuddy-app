const express = require('express');
const cors = require('cors');
require('dotenv').config();
const scrapeTeeTimes = require('./scrapeTeeTimes'); // 👈 this too

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/tee-times', async (req, res) => {
  const { date, players, lat, lon } = req.query;

  if (!date || !players || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const teeTimes = await scrapeTeeTimes({ date, players, lat, lon });
    res.json(teeTimes);
  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: 'Failed to scrape tee times' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});