const express = require('express');
const router = express.Router();
const User = require('../models/User');

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

// Single match endpoint
router.post('/match-by-email', async (req, res) => {
  try {
    const { userId, friendEmail } = req.body;
    if (!userId || !friendEmail) {
      return res.status(400).json({ message: 'userId and friendEmail required.' });
    }
    // Lowercase the email for case-insensitive match
    const friend = await User.findOne({ email: friendEmail.toLowerCase() });
    const user = await User.findById(userId);
    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Build a map for quick lookup
    const friendAvailMap = {};
    friend.availability.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      friendAvailMap[dateStr] = a.sections;
    });

    // Find matches
    const matches = [];
    user.availability.forEach(a1 => {
      const dateStr = a1.date.toISOString().split('T')[0];
      if (friendAvailMap[dateStr]) {
        // Find overlapping sections
        const overlap = a1.sections.filter(section => friendAvailMap[dateStr].includes(section));
        if (overlap.length > 0) {
          matches.push({ date: dateStr, sections: overlap });
        }
      }
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// Group match endpoint
router.post('/match-group', async (req, res) => {
  try {
    const { userId, emails } = req.body;
    if (!userId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'userId and emails array required.' });
    }
    // Lowercase all emails for case-insensitive match
    const allEmails = [...new Set(emails.map(e => e.toLowerCase()))];
    const users = await User.find({ email: { $in: allEmails } });
    if (users.length !== allEmails.length) {
      return res.status(404).json({ message: 'One or more users not found.' });
    }

    // Collect all availabilities
    const allAvailabilities = users.map(u => u.availability || []);

    // Find common dates and sections
    const dateMap = {};
    allAvailabilities.forEach((avail, idx) => {
      avail.forEach(({ date, sections }) => {
        if (!dateMap[date]) dateMap[date] = [];
        dateMap[date][idx] = sections;
      });
    });

    // Only keep dates where every user has availability
    const matches = Object.entries(dateMap)
      .filter(([date, arr]) => arr.length === users.length && arr.every(Boolean))
      .map(([date, arr]) => {
        // Find intersection of sections for all users
        const commonSections = arr.reduce((a, b) => a.filter(s => b.includes(s)));
        return commonSections.length > 0 ? { date, sections: commonSections } : null;
      })
      .filter(Boolean);

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;