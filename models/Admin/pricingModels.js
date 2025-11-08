const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for Video Pricing
const videoPriceSchema = new Schema({
  video: {
    type: String, // This will store the file path after upload
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  sponsorLogo:{type: String},
  sponsorText:{type: String},
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for Price Headings
const priceHeadingSchema = new Schema({
  image: {
    type: String, // This will store the file path after upload
    required: true
  },
  type: {
    type: String,
    required: true
  },
  head: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the 'updatedAt' field before saving
videoPriceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

priceHeadingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Models
const VideoPrice = mongoose.model('VideoPrice', videoPriceSchema);
const PriceHeading = mongoose.model('PriceHeading', priceHeadingSchema);

module.exports = {
  VideoPrice,
  PriceHeading
};