const Category = require("../../models/Admin/Category");
const SubCategory = require("../../models/Admin/SubCategory");

exports.createCategory = async (req, res) => {
  try {
    console.log("Create category - req.body:", req.body);
    const { name } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name: trimmedName });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Create category with only name field
    const categoryData = {
      name: trimmedName
    };
    
    console.log("Creating category with data:", categoryData);
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      details: error.errors || null,
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
    console.log("Update category - req.body:", req.body);
    console.log("Update category - req.params:", req.params);
    const { name } = req.body || {};
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    // Check if another category with same name exists
    const existingCategory = await Category.findOne({ 
      name: trimmedName,
      _id: { $ne: id }
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: { name: trimmedName } },
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
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      details: error.errors || null,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
