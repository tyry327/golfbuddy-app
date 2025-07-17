const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/golfbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import and use auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Import and use availability routes
const availabilityRoutes = require('./routes/availability');
app.use('/api/availability', availabilityRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('GolfBuddy API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});