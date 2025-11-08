const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  videoUrl: { type: String },
  subCategories: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
