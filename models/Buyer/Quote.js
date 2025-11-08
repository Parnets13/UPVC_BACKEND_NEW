const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productType: {
    type: String, 
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WindowSubOption',
    required: true
  },
  color: {
    type: String,
    required: true
  },
  isGenerated : {
    type: Boolean,
    default: false
  },
  installationLocation: {
    type: String,
    required: true
  },
  height: {
    type: Number,
    required: true,
    min: 1
  },
  width: {
    type: Number,
    required: true,
    min: 1
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  remark: {
    type: String
  },
  sqft: {
    type: Number,
    default: function() {
      return (this.height * this.width * this.quantity); // Total sqft for this quote item
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate sqft before save
quoteSchema.pre('save', function(next) {
  this.sqft = (this.height * this.width * this.quantity)
  this.updatedAt = Date.now();
  next();
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;















// const mongoose = require('mongoose');

// const quoteSchema = new mongoose.Schema({
//   buyer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   productType: {
//     type: String,
//     required: true
//   },
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'WindowSubOption',
//     required: true
//   },
//   color: {
//     type: String,
//     required: true
//   },
//   installationLocation: {
//     type: String,
//     required: true
//   },
//   height: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   width: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   remark: {
//     type: String
//   },
//   sqft: {
//     type: Number,
//     default: function() {
//       return (this.height * this.width * this.quantity)
//     }
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Calculate sqft before save
// quoteSchema.pre('save', function(next) {
//   this.sqft = (this.height * this.width * this.quantity) / 144;
//   this.updatedAt = Date.now();
//   next();
// });

// const Quote = mongoose.model('Quote', quoteSchema);

// module.exports = Quote;
















// const mongoose = require('mongoose');

// const quoteItemSchema = new mongoose.Schema({
//   productType: {
//     type: String,
//     required: true
//   },
//  product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'WindowSubOption',
//     required: true
//   },
//   color: {
//     type: String,
//     required: true
//   },
//   installationLocation: {
//     type: String,
//     required: true
//   },
//   height: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   width: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   remark: {
//     type: String
//   },
//   sqft: {
//     type: Number,
//     default: function() {
//       return (this.height * this.width * this.quantity) / 144; // Convert to sqft
//     }
//   }
// }, { _id: true }); // Keep individual IDs for each item

// const quoteSchema = new mongoose.Schema({
//   buyer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     unique: true // One cart per buyer
//   },
//   items: [quoteItemSchema], // Array of quote items
//   totalSqft: {
//     type: Number,
//     default: 0
//   },
//   totalQuantity: {
//     type: Number,
//     default: 0
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Calculate totals before save
// quoteSchema.pre('save', function(next) {
//   // Update sqft for each item
//   this.items.forEach(item => {
//     item.sqft = (item.height * item.width * item.quantity);
//   });

//   // Calculate totals
//   this.totalSqft = this.items.reduce((sum, item) => sum + item.sqft, 0);
//   this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
//   this.updatedAt = Date.now();
  
//   next();
// });

// const Quote = mongoose.model('Quote', quoteSchema);

// module.exports = Quote;