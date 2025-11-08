const WindowOption = require('../../models/Admin/WindowOption');
const WindowSubOptions = require('../../models/Admin/WindowSubOptions');

// Normalize file path (convert backslashes to forward slashes)
const normalizeFilePath = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, '/');
};

// Get all window options with pagination 

exports.getAllOptions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const options = await WindowSubOptions.find()
            .populate('option')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await WindowSubOptions.countDocuments();

        res.json({
            options,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Create new window option
exports.createOption = async (req, res) => {
    try {
        console.log('Create option - req.body:', req.body);
        console.log('Create option - req.file:', req.file);
        
        // Handle both FormData and JSON requests
        const body = req.body || {};
        const option = body.option;
        const title = body.title;
        const features = body.features;
        const videoUrl = body.videoUrl;
        
        // Validate required fields
        if (!option) {
            return res.status(400).json({ message: "Option (parent option) is required" });
        }
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }
        
        const parent = await WindowOption.findById(option);
        if (!parent) {
            return res.status(404).json({ message: "Parent option not found" });
        }

        // Handle video file upload - if file is uploaded, use it; otherwise use videoUrl from body
        let finalVideoUrl = videoUrl || '';
        if (req.file) {
            // File was uploaded, use the normalized file path
            finalVideoUrl = normalizeFilePath(req.file.path);
            console.log('Using uploaded file:', finalVideoUrl);
        } else if (videoUrl) {
            console.log('Using video URL:', videoUrl);
        }

        const featuresList = features ? (typeof features === 'string' ? features.split(",") : features) : [];
        const newOption = new WindowSubOptions({
            option,
            title,
            features : featuresList,
            videoUrl: finalVideoUrl
        });

        await newOption.save();
        res.status(201).json(newOption);
    } catch (error) {
        console.error('Error creating sub-option:', error);
        res.status(400).json({ message: error.message });
    }
};  

// Update window option (partial update) 


exports.updateOption = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Handle both FormData and JSON requests
        const body = req.body || {};
        const option = body.option;
        const title = body.title;
        const features = body.features;
        const videoUrl = body.videoUrl;
        
        const updates = {
            updatedAt: new Date()
        };

        // Update fields if provided
        if (option) updates.option = option;
        if (title) updates.title = title;
        if (features) updates.features = typeof features === 'string' ? features.split(",") : features;
        if (videoUrl !== undefined) updates.videoUrl = videoUrl;

        // Handle video file upload - if file is uploaded, use it; otherwise keep existing or use videoUrl from body
        if (req.file) {
            // File was uploaded, use the normalized file path
            updates.videoUrl = normalizeFilePath(req.file.path);
        }

        const optionDoc = await WindowSubOptions.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!optionDoc) {
            return res.status(404).json({ message: 'Option not found' });
        }

        res.json(optionDoc);
    } catch (error) {
        console.error('Error updating sub-option:', error);
        res.status(400).json({ message: error.message });
    }
};                                                     
// Delete window option
exports.deleteOption = async (req, res) => {
    try {
        const { id } = req.params;
        const option = await WindowSubOptions.findByIdAndDelete(id);

        if (!option) {
            return res.status(404).json({ message: 'Option not found' });
        }

        res.json({ message: 'Option deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};  

// Get predefined window options
exports.getPredefinedOptions = async (req, res) => {
    const predefinedOptions = [
        "Sliding Window", "Sliding Door", "Casement Windows", "Casement Doors",
        "Fixed Windows", "Bathroom Ventilators", "Combination Windows", "Special Architectural Windows"
    ];
    res.json(predefinedOptions);
};