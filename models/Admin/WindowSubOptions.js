const mongoose = require("mongoose");

const WindowOptionSchema = new mongoose.Schema({
  option: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WindowOption",
    required: true,
  },
  videoUrl: { type: String },
  title: { type: String, required: true },
  features: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WindowSubOption", WindowOptionSchema);
