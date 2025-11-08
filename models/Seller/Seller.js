const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SellerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  companyName: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  yearsInBusiness: {
    type: Number,
  },
  pinCode: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  website: {
    type: String,
    trim: true,
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  gstCertificate: {
    type: String,
  },
  visitingCard: {
    type: String,
  },
  brandOfProfileUsed: {
    type: String,
    trim: true,
  },
  businessProfileVideo: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "blocked"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }, 
  leads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],
  isVerified:{
    type: Boolean,
    default: false
  },

  //new fields :

  freeQuota: {
    currentMonthQuota: { type: Number, default: 200 },
    nextResetDate: { type: Date, default: () => {
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      return now;
    }},
    usedQuota: { type: Number, default: 0 }
  },
  quotaUsage: [{
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    sqftUsed: Number,
    date: { type: Date, default: Date.now }
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
SellerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

SellerSchema.methods.checkQuotaReset = function() {
  const now = new Date();
  if (now >= this.freeQuota.nextResetDate) {
    this.freeQuota = {
      currentMonthQuota: 200,
      usedQuota: 0,
      nextResetDate: new Date(now.setMonth(now.getMonth() + 1))
    };
  }
};

const Seller = mongoose.model("Seller", SellerSchema);

module.exports = Seller;
