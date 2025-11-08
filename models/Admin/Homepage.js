const mongoose = require('mongoose');

const keyMomentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  timestamp: { type: String, required: true, match: /^\d{2}\.\d{2}$/ }, // Format: 00.00
  thumbnail: { type: String, required: true }
});

const upvcHomepageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  videoUrl: { type: String, required: true },
  keyMoments: [keyMomentSchema],
  sponsorLogo: { type: String },
  sponsorText: { type: String }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UpvcHomepage', upvcHomepageSchema);