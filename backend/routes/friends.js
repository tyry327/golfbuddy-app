const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get friends list
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const friends = user.friends.map(f => ({
      id: f._id.toString(),
      name: f.name,
      email: f.email
    }));
    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a friend by name or email
router.post('/add', async (req, res) => {
  const { userId, friendIdentifier } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find friend by email or name (case-insensitive)
    const friend = await User.findOne({
      $or: [
        { email: new RegExp(`^${friendIdentifier}$`, 'i') },
        { name: new RegExp(`^${friendIdentifier}$`, 'i') }
      ]
    });
    if (!friend) return res.status(404).json({ message: 'Friend not found' });
    if (friend._id.equals(user._id)) return res.status(400).json({ message: 'Cannot add yourself as a friend.' });
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    user.friends.push(friend._id);
    await user.save();
    res.json({ message: 'Friend added', friend: { id: friend._id, name: friend.name, email: friend.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a friend
router.post('/remove', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.friends = user.friends.filter(fid => fid.toString() !== friendId);
    await user.save();
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;