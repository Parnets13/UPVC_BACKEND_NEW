const WindowOption = require("../../models/Admin/WindowOption");
const WindowSubOptions = require("../../models/Admin/WindowSubOptions");

// GET all
const getOptions = async (req, res) => {
  const options = await WindowOption.find();
  const optionsWithChildren = await Promise.all(
    options.map(async (parent) => {
      const children = await WindowSubOptions.find({ option: parent._id });
      return {
        _id: parent._id,
        title: parent.title,
        subOptions: children,
      };
    })
  );
  res.json(optionsWithChildren);
};

// POST new
const createOption = async (req, res) => {
  const { title } = req.body;
  const newOption = await WindowOption.create({ title });
  res.status(201).json(newOption);
};

// PUT update
const updateOption = async (req, res) => {
  const { id } = req.params;
  const updated = await WindowOption.findByIdAndUpdate(
    id,
    { title: req.body.title },
    { new: true }
  );
  res.json(updated);
};

// DELETE
const deleteOption = async (req, res) => {
  const { id } = req.params;
  await WindowOption.findByIdAndDelete(id);
  res.json({ message: "Deleted successfully" });
};

module.exports = { getOptions, createOption, updateOption, deleteOption };
