const mongoose = require('mongoose');

const colorVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  src: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  sponsorLogo:{type: String},
  sponsorText:{type: String},
  filesize: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ColorVideo', colorVideoSchema);