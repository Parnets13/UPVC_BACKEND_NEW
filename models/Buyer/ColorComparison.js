const mongoose = require('mongoose');

const colorComparisonSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  white: {
    type: String,
    required: true,
    trim: true
  },
  lam: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ColorComparison', colorComparisonSchema);