/**
 * Cleanup Script - Delete all advertisements from database
 * Use this to start fresh in development
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Advertisement = require('../models/Admin/buyerAdvertisement');

async function cleanupAdvertisements() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Get all advertisements
    const ads = await Advertisement.find();
    console.log(`\nFound ${ads.length} advertisements in database:`);
    
    ads.forEach((ad, index) => {
      console.log(`${index + 1}. ${ad.title} (${ad.type}) - ${ad.mediaUrl}`);
    });

    // Delete all advertisements
    console.log('\nDeleting all advertisements...');
    const result = await Advertisement.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} advertisements`);

    console.log('\nCleanup complete! You can now upload fresh advertisements.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupAdvertisements();
