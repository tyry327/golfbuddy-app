const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Add or update availability for a user
router.post('/set', async (req, res) => {
  const { userId, availability } = req.body; // [{ date: 'YYYY-MM-DD', sections: [...] }]
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { availability },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Availability updated', availability: user.availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get availability for a user
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ availability: user.availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Find matching dates between two users
router.post('/match', async (req, res) => {
  const { userId1, userId2 } = req.body;
  try {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);
    if (!user1 || !user2) return res.status(404).json({ message: 'User not found' });

    // Find intersection of availability dates
    const dates1 = user1.availability.map(d => d.toISOString().split('T')[0]);
    const dates2 = user2.availability.map(d => d.toISOString().split('T')[0]);
    const matches = dates1.filter(date => dates2.includes(date));
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Find matching dates and sections by email
router.post('/match-by-email', async (req, res) => {
  const { userId, friendEmail } = req.body;
  try {
    const user1 = await User.findById(userId);
    const user2 = await User.findOne({ email: friendEmail });
    if (!user1 || !user2) return res.status(404).json({ message: 'User not found' });

    // Build a map for quick lookup
    const user2AvailMap = {};
    user2.availability.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      user2AvailMap[dateStr] = a.sections;
    });

    // Find matches
    const matches = [];
    user1.availability.forEach(a1 => {
      const dateStr = a1.date.toISOString().split('T')[0];
      if (user2AvailMap[dateStr]) {
        // Find overlapping sections
        const overlap = a1.sections.filter(section => user2AvailMap[dateStr].includes(section));
        if (overlap.length > 0) {
          matches.push({ date: dateStr, sections: overlap });
        }
      }
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;