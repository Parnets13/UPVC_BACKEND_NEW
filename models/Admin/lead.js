const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
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
    required: true
  },
  width: {
    type: Number,
    required: true
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
  }
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
  }],
  price: {
    type: Number
  },
  quotes: [quoteSchema],
  contactInfo: {
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    whatsappNumber: {
      type: String
    },
    email: {
      type: String
    }
  },
  projectInfo: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    googleMapLink: {
      type: String
    },
    stage: {
      type: String,
      enum: ['planning', 'under construction', 'ready to move', 'other'],
      required: true
    },
    timeline: {
      type: String,
      enum: ['0-30 days', '31-60 days', 'above 60 days'],
      required: true
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  totalSqft: {
    type: Number,
    default: function() {
      return this.quotes.reduce((total, quote) => total + quote.sqft * quote.quantity, 0);
    }
  },
  totalQuantity: {
    type: Number,
    default: function() {
      return this.quotes.reduce((total, quote) => total + quote.quantity, 0);
    }
  },
  pricePerSqft: { type: Number, default: 10.50 },
  availableSlots: {
    type: Number,
    default: 6,
    min: 0,
    max: 6
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'closed', 'cancelled'],
    default: 'new'
  },

  //new fields :
  basePricePerSqft: { type: Number, default: 10.50 },
  dynamicSlotPrice: { type: Number }, // will be calculated
  maxSlots: { type: Number }, // will be calculated
  overProfit:{type : Boolean , default : false},
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

function enforceUniqueSellerIfSmallSqft(leadDoc) {
  const totalSqft = leadDoc.quotes.reduce((sum, q) => sum + (q.sqft || 0) * (q.quantity || 0), 0);

  if (totalSqft <= 50) {
    const sellerIds = leadDoc.seller.map(s => s.sellerId?.toString());
    const uniqueSellerIds = [...new Set(sellerIds)];

    if (sellerIds.length !== uniqueSellerIds.length) {
      throw new Error('For leads ≤ 50 sqft, sellers must be unique.');
    }
  }
}

// leadSchema.pre('save', function (next) {
//   enforceUniqueSellerIfSmallSqft(this);
//   next();
// });

// leadSchema.pre('findOneAndUpdate', async function (next) {
//   const docToUpdate = await this.model.findOne(this.getQuery());
//   if (docToUpdate) {
//     const update = this.getUpdate();
    
//     // Simulate updated seller list
//     let newSellerList = docToUpdate.seller || [];
//     if (update.$push && update.$push.seller) {
//       newSellerList = [...newSellerList, update.$push.seller];
//     }
//     if (update.$set && update.$set.seller) {
//       newSellerList = update.$set.seller;
//     }

//     const simulatedDoc = {
//       ...docToUpdate.toObject(),
//       seller: newSellerList
//     };

//     enforceUniqueSellerIfSmallSqft(simulatedDoc);
//   }
//   next();
// });


// leadSchema.pre('save', function (next) {
//   // Calculate totalSqft dynamically before saving
//   const totalSqft = this.quotes.reduce((sum, quote) => sum + (quote.sqft || 0) * (quote.quantity || 0), 0);
  
//   if (totalSqft <= 50) {
//     const sellerIds = this.seller.map(s => s.sellerId?.toString());
//     const uniqueSellerIds = [...new Set(sellerIds)];

//     if (sellerIds.length !== uniqueSellerIds.length) {
//       return next(new Error('For leads ≤ 50 sqft, sellers must be unique.'));
//     }
//   }

//   next();
// });


// Update timestamps and calculated fields before save

// leadSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
  
//   // Recalculate totals if quotes are modified
//   if (this.isModified('quotes')) {
//     this.totalSqft = this.quotes.reduce((total, quote) => total + quote.sqft * quote.quantity, 0);
//     this.totalQuantity = this.quotes.reduce((total, quote) => total + quote.quantity, 0);
//     this.pricePerSqft = 6250 / (this.totalSqft * 6);
//   }
  
//   next();
// });

// Add pre-save hook to calculate slots and pricing

// leadSchema.pre('save', function(next) {
//   // Recalculate totals if quotes are modified
//   if (this.isModified('quotes')) {
//     this.totalSqft = this.quotes.reduce((total, quote) => total + quote.sqft * quote.quantity, 0);
//     this.totalQuantity = this.quotes.reduce((total, quote) => total + quote.quantity, 0);
    
//     // Calculate dynamic slots and pricing
//     const baseValue = this.totalSqft * this.basePricePerSqft;
//     const targetProfit = 6250;
    
//     if (baseValue * 6 > targetProfit) {
//       // Calculate optimal slots to keep near target profit
//       this.maxSlots = Math.max(1, Math.floor(targetProfit / baseValue));
//       this.dynamicSlotPrice = targetProfit / this.maxSlots;
//       this.overProfit = true;
//     } else {
//       // For smaller leads, keep 6 slots
//       this.maxSlots = 6;
//       this.dynamicSlotPrice = baseValue;
//     }
    
//     this.availableSlots = this.maxSlots;
//   }
//   next();
// });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;