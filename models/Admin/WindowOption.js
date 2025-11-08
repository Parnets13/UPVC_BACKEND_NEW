const mongoose = require('mongoose');

const windowOptionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('WindowOption', windowOptionSchema);
