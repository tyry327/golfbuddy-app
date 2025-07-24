const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  availability: [{
    date: { type: Date, required: true },
    sections: [{ type: String, enum: ['morning', 'midday', 'afternoon', 'evening'] }]
  }]
  // friends field removed
});

module.exports = mongoose.model('User', UserSchema);