const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const Lead = require('../models/Admin/lead');
const User = require('../models/Buyer/User');
const Category = require('../models/Admin/Category');
const WindowSubOption = require('../models/Admin/WindowSubOptions');

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/upvc';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected to:', mongoUri.replace(/\/\/.*@/, '//***@')); // Hide credentials
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestLead = async () => {
  try {
    await connectDB();

    console.log('\n=== Creating Test Lead ===\n');

    // Find or create a test buyer
    let buyer = await User.findOne({ mobileNumber: '9999999999' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Test Buyer',
        mobileNumber: '9999999999',
        email: 'testbuyer@example.com'
      });
      console.log('✅ Created test buyer:', buyer._id);
    } else {
      console.log('✅ Using existing buyer:', buyer._id);
    }

    // Find or create a test category
    let category = await Category.findOne({ name: 'Windows' });
    if (!category) {
      category = await Category.create({
        name: 'Windows',
        description: 'Test Category for Windows'
      });
      console.log('✅ Created test category:', category._id);
    } else {
      console.log('✅ Using existing category:', category._id);
    }

    // Find a product (WindowSubOption)
    let product = await WindowSubOption.findOne();
    if (!product) {
      console.log('⚠️  No products found. Creating a minimal product...');
      // Create a minimal product if none exists
      product = await WindowSubOption.create({
        title: 'Test Window Product',
        features: ['Test Feature 1', 'Test Feature 2']
      });
      console.log('✅ Created test product:', product._id);
    } else {
      console.log('✅ Using existing product:', product._id, '-', product.title);
    }

    // Calculate lead data
    const height = 60; // inches
    const width = 36; // inches
    const quantity = 2;
    const sqft = (height * width) / 144; // Convert to sqft
    const totalSqft = sqft * quantity;

    // Calculate dynamic slots and pricing
    const basePricePerSqft = 10.50;
    const baseValue = totalSqft * basePricePerSqft;
    const targetProfit = 6250;
    
    let maxSlots, dynamicSlotPrice, overProfit;
    
    if (baseValue * 6 > targetProfit) {
      maxSlots = Math.max(1, Math.floor(targetProfit / baseValue));
      dynamicSlotPrice = targetProfit / maxSlots;
      overProfit = true;
    } else {
      maxSlots = 6;
      dynamicSlotPrice = baseValue;
      overProfit = false;
    }

    // Create test lead
    const testLead = await Lead.create({
      buyer: buyer._id,
      quotes: [{
        productType: 'Window',
        product: product._id,
        color: 'White',
        installationLocation: 'Living Room',
        height: height,
        width: width,
        quantity: quantity,
        sqft: sqft,
        isGenerated: true
      }],
      contactInfo: {
        name: 'Test Buyer',
        contactNumber: '9999999999',
        whatsappNumber: '9999999999',
        email: 'testbuyer@example.com'
      },
      projectInfo: {
        name: 'Test Project',
        address: '123 Test Street, Test City',
        area: 'Test Area',
        pincode: '560001',
        googleMapLink: 'https://maps.google.com',
        stage: 'planning',
        timeline: '0-30 days'
      },
      category: category._id,
      totalSqft: totalSqft,
      totalQuantity: quantity,
      pricePerSqft: 10.5,
      basePricePerSqft: basePricePerSqft,
      availableSlots: maxSlots,
      maxSlots: maxSlots,
      dynamicSlotPrice: dynamicSlotPrice,
      overProfit: overProfit,
      status: 'new'
    });

    console.log('\n✅ Test Lead Created Successfully!');
    console.log('Lead ID:', testLead._id);
    console.log('Buyer:', buyer.name);
    console.log('Total Sqft:', totalSqft);
    console.log('Available Slots:', testLead.availableSlots);
    console.log('Max Slots:', testLead.maxSlots);
    console.log('Dynamic Slot Price:', testLead.dynamicSlotPrice);
    console.log('Status:', testLead.status);
    console.log('Created At:', testLead.createdAt);
    console.log('\n✅ Lead is ready to be displayed in seller dashboard!\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test lead:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};


createTestLead();

