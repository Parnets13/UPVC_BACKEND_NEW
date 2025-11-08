const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  videoUrl: { type: String },
  features: [String],
  benefits: [String]
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
