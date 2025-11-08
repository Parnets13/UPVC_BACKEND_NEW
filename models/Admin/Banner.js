// const mongoose = require('mongoose');

// const chapterSchema = new mongoose.Schema({
//   time: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 100
//   },
//   duration: {
//     type: String,
//     required: true,
    
//   },
//   thumbnailFilename: {
//     type: String,
//     required: true
//   },
//   thumbnailFilepath: {
//     type: String,
//     required: true
//   },
//   thumbnailMimetype: {
//     type: String,
//     required: true,
//     enum: ['image/jpeg', 'image/png', 'image/webp']
//   },
//   thumbnailFilesize: {
//     type: Number,
//     required: true,
//     min: 1024, // 1KB
//     max: 5242880 // 5MB
//   }
// }, { _id: false });

// const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 100
//   },
//   description: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 500
//   },
//   filename: {
//     type: String,
//     required: true
//   },
//   filepath: {
//     type: String,
//     required: true
//   },
//   mimetype: {
//     type: String,
//     required: true,
//     enum: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
//   },
//   filesize: {
//     type: Number,
//     required: true,
//     min: 1048576, // 1MB
//     max: 524288000 // 500MB
//   },
//   chapters: {
//     type: [chapterSchema],
//     required: true,
//     validate: {
//       validator: function(chapters) {
//         return chapters.length === 4;
//       },
//       message: 'There must be exactly 4 chapters'
//     }
//   },
  
// }, { 
//   timestamps: true,
//   toJSON: {
//     virtuals: true,
//     transform: function(doc, ret) {
//       ret.id = ret._id;
//       delete ret._id;
//       delete ret.__v;
//       return ret;
//     }
//   }
// });

// // Virtuals
// bannerSchema.virtual('videoUrl').get(function() {
//   return `/uploads/banners/${this.filename}`;
// });

// bannerSchema.virtual('thumbnails').get(function() {
//   return this.chapters.map(ch => ({
//     ...ch.toObject(),
//     url: `/uploads/thumbnails/${ch.thumbnailFilename}`
//   }));
// });

// // Indexes
// bannerSchema.index({ title: 'text', description: 'text' });
// bannerSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Banner', bannerSchema);

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: String,
    required: true
  },
  thumbnailFilename: {
    type: String,
    
  },
  thumbnailFilepath: {
    type: String,
    // required: true
  },
  thumbnailMimetype: {
    type: String,
    
  },
  thumbnailFilesize: {
    type: Number,
    required: false
  }
});

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  filesize: {
    type: Number,
    required: true
  },
  moment_title: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: String,
    required: true,
    default: "0:00"
  },
  thumbnailFilename: {
    type: String,
    // required: true
  },
  thumbnailFilepath: {
    type: String,
    // required: true
  },
  thumbnailMimetype: {
    type: String,
    // required: true
  },
  thumbnailFilesize: {
    type: Number,
    // required: false
  },
  chapters: [chapterSchema]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Banner', bannerSchema);