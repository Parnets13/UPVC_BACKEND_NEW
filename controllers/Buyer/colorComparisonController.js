const ColorComparison = require('../../models/Buyer/ColorComparison');

// CREATE
exports.createComparison = async (req, res) => {
  try {
    const comparison = await ColorComparison.create({
      type: req.body.type,
      white: req.body.white,
      lam: req.body.lam,
      order: req.body.order || 0,
      isActive: req.body.isActive ?? true
    });
    res.status(201).json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ ALL
exports.getComparisons = async (req, res) => {
  try {
    const comparisons = await ColorComparison.find({ isActive: true }).sort({ order: 1 });
    res.json(comparisons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ BY ID
exports.getComparisonById = async (req, res) => {
  try {
    const comparison = await ColorComparison.findById(req.params.id);
    if (!comparison) return res.status(404).json({ error: "Comparison not found" });
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateComparison = async (req, res) => {
  try {
    const comparison = await ColorComparison.findByIdAndUpdate(
      req.params.id,
      {
        type: req.body.type,
        white: req.body.white,
        lam: req.body.lam,
        order: req.body.order,
        isActive: req.body.isActive
      },
      { new: true }
    );

    if (!comparison) return res.status(404).json({ error: "Comparison not found" });

    res.json({
      message: "Comparison updated successfully",
      data: comparison
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE 
exports.deleteComparison = async (req, res) => {
  try {
    const deleted = await ColorComparison.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Comparison not found" });

    res.json({ message: "Comparison deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
