const Category = require("../../models/Admin/Category");
const SubCategory = require("../../models/Admin/SubCategory");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const category = await Category.create({
      name
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 5;
  // const skip = (page - 1) * limit;
  try {
    const categories = await Category.find()
      // .skip(skip)
      // .limit(limit)
      .sort({ createdAt: -1 });
    const populated = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubCategory.find({
          parentCategory: cat._id,
        });
        return { ...cat.toObject(), subcategories };
      })
    );
    res.json(populated);
  } catch (error) {
    console.error("Error : ", error);
    res.status(400).json({
      error: error.message,
      details: error.errors,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body || {};
    const { id } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: { name } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
