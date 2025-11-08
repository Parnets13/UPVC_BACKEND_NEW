const Feedback = require('../../models/Buyer/Feedback');

exports.createFeedback = async (req, res) => {
  try {
    const feedback = new Feedback({
      name: req.body.name,
      phone: req.body.phone,
      text: req.body.text,
      stars: req.body.stars
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error : " , error)
    res.status(400).json({ 
      error: error.message,
      details: error.errors 
    });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    console.log('Feedback pagination:', { page: pageNum, limit: pageSize, query: req.query });

    const [total, feedbacks] = await Promise.all([
      Feedback.countDocuments({}),
      Feedback.find({})
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    console.log('Feedback results:', { total, returned: feedbacks.length, page: pageNum });

    res.json({ success: true, total, page: pageNum, limit: pageSize, count: feedbacks.length, items: feedbacks });
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        text: req.body.text,
        stars: req.body.stars
      },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: error.errors 
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};