const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Admin/lead');
const User = require('../models/Buyer/User');
const Category = require('../models/Admin/Category');
const WindowSubOption = require('../models/Admin/WindowSubOptions');

async function createTestLead() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get first buyer
    const buyer = await User.findOne();
    if (!buyer) {
      console.log('No buyer found. Please create a buyer first.');
      process.exit(1);
    }
    console.log('Using buyer:', buyer._id, buyer.name || buyer.email);

    // Get first category
    const category = await Category.findOne();
    if (!category) {
      console.log('No category found. Please create a category first.');
      process.exit(1);
    }
    console.log('Using category:', category._id, category.name);

    // Get first product
    const product = await WindowSubOption.findOne();
    if (!product) {
      console.log('No product found. Please create a product first.');
      process.exit(1);
    }
    console.log('Using product:', product._id, product.title);

    // Create test lead
    const lead = new Lead({
      buyer: buyer._id,
      category: category._id,
      quotes: [{
        productType: 'Window',
        product: product._id,
        color: 'White',
        installationLocation: 'Living Room',
        height: 4,
        width: 3,
        quantity: 2,
        sqft: 12,
        remark: 'Test lead'
      }],
      contactInfo: {
        name: 'Test Buyer',
        contactNumber: '9876543210',
        whatsappNumber: '9876543210',
        email: 'test@example.com'
      },
      projectInfo: {
        name: 'Test Project',
        address: '123 Test Street',
        area: 'Test Area',
        pincode: '560001',
        stage: 'planning',
        timeline: '0-30 days'
      },
      totalSqft: 24,
      totalQuantity: 2,
      status: 'new',
      availableSlots: 6,
      maxSlots: 6,
      dynamicSlotPrice: 315
    });

    await lead.save();
    console.log('\n✅ Test lead created successfully!');
    console.log('Lead ID:', lead._id);
    console.log('Status:', lead.status);
    console.log('Total Sqft:', lead.totalSqft);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestLead();
