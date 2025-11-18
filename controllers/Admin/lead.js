const Lead = require('../../models/Admin/lead');
const User = require('../../models/Buyer/User');
const Seller = require('../../models/Seller/Seller');
const WindowSubOption = require('../../models/Admin/WindowSubOptions');
const Category = require('../../models/Admin/Category');
const Quote = require('../../models/Buyer/Quote');
const mongoose = require('mongoose');

// Create a new lead
// exports.createLead = async (req, res) => {
//   try {
//     const { quotes, contactInfo, projectInfo, categoryId, totalSqft } = req.body;
//     // console.log("totalSqft : " , totalSqft)
//     // Validate buyer exists
//     const buyer = await User.findById({_id : req.user._id});
//     if (!buyer) {
//       return res.status(404).json({ success: false, message: 'Buyer not found' });
//     }

//     // Validate category exists
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ success: false, message: 'Category not found' });
//     }

//     // Validate all products in quotes exist
//     for (const quote of quotes) {
//       const product = await WindowSubOption.findById(quote.product);
//       if (!product) {
//         return res.status(404).json({ 
//           success: false, 
//           message: `Product not found for ID: ${quote.product}` 
//         });
//       }
//     }
     
//     const lead = new Lead({
//       buyer: req.user._id,
//       quotes,
//       contactInfo,
//       projectInfo,
//       category: categoryId, 
//     });

//     await lead.save();
    

//     res.status(201).json({
//       success: true,
//       message: 'Lead created successfully',
//       lead
//     });
//   } catch (error) {
//     console.error('Error creating lead:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.createLead = async (req, res) => {
  try {
    console.log('=== createLead API Called ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', req.user?._id);

    const { quotes, contactInfo, projectInfo, categoryId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login.' 
      });
    }

    const buyer = await User.findById(req.user._id);
    if (!buyer) {
      console.log('Buyer not found for ID:', req.user._id);
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    console.log('Buyer found:', buyer.name || buyer.mobileNumber);

    if (!categoryId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category ID is required' 
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      console.log('Category not found for ID:', categoryId);
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    console.log('Category found:', category.name);

    if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one quote is required' 
      });
    }

    let totalSqft = 0;
    let totalQuantity = 0;

    const validatedQuotes = [];

    for (const quote of quotes) {
      console.log("Processing quote:", quote);
      
      if (!quote.product) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product ID is required for each quote' 
        });
      }

      const product = await WindowSubOption.findById(quote.product);
      if (!product) {
        console.log('Product not found for ID:', quote.product);
        return res.status(404).json({ 
          success: false, 
          message: `Product not found for ID: ${quote.product}` 
        });
      }

      const { height, width, quantity } = quote;

      if (!height || !width || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each quote must include height, width, and quantity',
        });
      }

      // Calculate sqft - use provided sqft or calculate from height/width
      // Frontend sends height/width in feet, so calculation is: height * width
      const sqft = quote.sqft || (height * width);
      const quoteSqftTotal = sqft * quantity;

      totalSqft += quoteSqftTotal;
      totalQuantity += quantity;

      validatedQuotes.push({
        productType: quote.productType,
        product: quote.product,
        color: quote.color,
        installationLocation: quote.installationLocation,
        height: height,
        width: width,
        quantity: quantity,
        remark: quote.remark || '',
        sqft: sqft,
        isGenerated: quote.isGenerated !== undefined ? quote.isGenerated : true
      });
    }

    console.log('Total Sqft calculated:', totalSqft);
    console.log('Total Quantity:', totalQuantity);

    // Update quotes in database if they have _id (existing quotes)
    if (quotes.some(q => q._id)) {
      const bulkOps = quotes
        .filter(q => q._id) // Only update quotes that have _id
        .map(q => ({
          updateOne: {
            filter: { _id: q._id, buyer: req.user._id }, // Also verify buyer owns the quote
            update: { $set: { isGenerated: q.isGenerated !== undefined ? q.isGenerated : true } }
          }
        }));
      
      if (bulkOps.length > 0) {
        console.log("Updating quotes:", bulkOps.length);
        try {
          await Quote.bulkWrite(bulkOps);
        } catch (error) {
          console.error('Error updating quotes:', error);
          // Don't fail the lead creation if quote update fails
        }
      }
    }

    // Calculate dynamic slots and pricing
    const basePricePerSqft = 10.50;
    const baseValue = totalSqft * basePricePerSqft;
    const targetProfit = 6250;
    
    let maxSlots, dynamicSlotPrice, overProfit;
    
    if (baseValue * 6 > targetProfit) {
      // Calculate optimal slots to keep near target profit
      maxSlots = Math.max(1, Math.floor(targetProfit / baseValue));
      dynamicSlotPrice = targetProfit / maxSlots;
      overProfit = true;
    } else {
      // For smaller leads, keep 6 slots
      maxSlots = 6;
      dynamicSlotPrice = baseValue;
      overProfit = false;
    }

    const lead = new Lead({
      buyer: req.user._id,
      quotes: validatedQuotes,
      contactInfo,
      projectInfo,
      category: categoryId,
      totalSqft,
      totalQuantity,
      pricePerSqft: 10.5,
      basePricePerSqft: basePricePerSqft,
      availableSlots: maxSlots,
      maxSlots: maxSlots,
      dynamicSlotPrice: dynamicSlotPrice,
      overProfit: overProfit,
      // pricePerSqft: totalSqft > 0 ? 6250 / (totalSqft * 6) : 0,
    });

    await lead.save();

    console.log('\n✅ Lead Created Successfully!');
    console.log('Lead ID:', lead._id);
    console.log('Buyer:', buyer.name || buyer.mobileNumber);
    console.log('Total Sqft:', totalSqft);
    console.log('Available Slots:', lead.availableSlots);
    console.log('Max Slots:', lead.maxSlots);
    console.log('Dynamic Slot Price:', lead.dynamicSlotPrice);
    console.log('Status:', lead.status);
    console.log('Created At:', lead.createdAt);
    console.log('========================================\n');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });

  } catch (error) {
    console.error('\n❌ Error creating lead:', error);
    console.error('Error stack:', error.stack);
    console.error('========================================\n');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all leads with filters
exports.getAllLeads = async (req, res) => {
  try {
    const { status, buyerId, sellerId, categoryId, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Valid status values
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    
    // If status is provided, validate and normalize it
    if (status) {
      const statusMap = {
        'active': 'in-progress',
        'pending': 'new',
        'sold': 'closed'
      };
      const normalizedStatus = statusMap[status] || status;
      if (validStatuses.includes(normalizedStatus)) {
        filter.status = normalizedStatus;
      }
    }

    if (buyerId) filter.buyer = buyerId;
    if (categoryId) filter.category = categoryId;
    if (sellerId) filter['seller.sellerId'] = sellerId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 100));

    // Log the filter for debugging
    console.log('=== getAllLeads API Call ===');
    console.log('Filter:', JSON.stringify(filter, null, 2));
    console.log('Page:', pageNum, 'Limit:', pageSize);

    // Use lean() to avoid validation errors on invalid status values
    // We'll filter and normalize statuses in the results
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('buyer', 'name email phoneNumber')
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber businessProfileVideo visitingCard yearsInBusiness status isActive')
        .populate('category', 'name description videoUrl')
        .populate('quotes.product', 'title features videoUrl')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(), // Use lean() to get plain objects and avoid validation errors
    ]);

    // Log results for debugging
    console.log('Total leads found:', total);
    console.log('Leads returned:', leads.length);
    if (leads.length > 0) {
      console.log('Sample lead:', {
        id: leads[0]._id,
        availableSlots: leads[0].availableSlots,
        status: leads[0].status,
        createdAt: leads[0].createdAt,
        totalSqft: leads[0].totalSqft
      });
    }

    // Normalize status values in the results
    const normalizedLeads = leads.map(lead => {
      const statusMap = {
        'active': 'in-progress',
        'pending': 'new',
        'sold': 'closed'
      };
      
      if (lead.status && !validStatuses.includes(lead.status)) {
        lead.status = statusMap[lead.status] || 'new';
      }
      
      return lead;
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: normalizedLeads.length,
      leads: normalizedLeads
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('buyer')
      .populate('seller.sellerId')
      .populate('category')
      .populate('quotes.product');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Seller purchases a lead
// exports.purchaseLead = async (req, res) => {
//   try {
//     const { leadId } = req.body;
//     const sellerId = req.seller._id
//     // Validate lead exists
//     const lead = await Lead.findById(leadId);
//     if (!lead) {
//       return res.status(404).json({
//         success: false,
//         message: 'Lead not found'
//       });
//     }

//     // Validate seller exists
//     const seller = await Seller.findById(sellerId);
//     if (!seller) {
//       return res.status(404).json({
//         success: false,
//         message: 'Seller not found'
//       });
//     }

//     // Check if lead has available slots
//     if (lead.availableSlots <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No available slots left for this lead'
//       });
//     }

//         // Get all sellers in the same city as the project
//     const sellersInCity = await Seller.find({ 
//       city: lead.projectInfo.address.city, // Assuming city is in projectInfo.address
//       status: 'approved',
//       isActive: true
//     });

//     // Count brands in the city
//     const brandCounts = {};
//     sellersInCity.forEach(seller => {
//       if (seller.brandOfProfileUsed) {
//         brandCounts[seller.brandOfProfileUsed] = 
//           (brandCounts[seller.brandOfProfileUsed] || 0) + 1;
//       }
//     });

//     // Check if any brand has reached the limit (2 sellers)
//     const brandsAtLimit = Object.entries(brandCounts)
//       .filter(([_, count]) => count >= 2)
//       .map(([brand]) => brand);

//     if (brandsAtLimit.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Oops you have missed the bus by a whisker. Your brand in your city is already registered by 2 other fabricators.`,
//         brandsAtLimit
//       });
//     }

//     // Check if seller already purchased this lead
//     const alreadyPurchased = lead.seller.some(s => s.sellerId.toString() === sellerId);
//     if (alreadyPurchased) {
//       return res.status(400).json({
//         success: false,
//         message: 'Seller already purchased this lead'
//       });
//     }

//     // Add seller to lead and decrease available slots
//     lead.seller.push({ sellerId });
//     lead.availableSlots -= 1;
    
//     // Update status if all slots are taken
//     if (lead.availableSlots === 0) {
//       lead.status = 'in-progress';
//     }

//     await lead.save();

//     res.status(200).json({
//       success: true,
//       message: 'Lead purchased successfully',
//       lead
//     });
//   } catch (error) {
//     console.error('Error purchasing lead:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.purchaseLead = async (req, res) => {
  try {
    const { leadId, slotsToBuy, useFreeQuota, freeSqftToUse, price } = req.body;
    // console.log("price : " , price)
    // return
    const sellerId = req.seller._id

    if (!leadId || !sellerId || !slotsToBuy || slotsToBuy <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Missing or invalid parameters.'
      });
    }

    // Convert leadId to ObjectId if it's a string
    const leadObjectId = typeof leadId === 'string' ? new mongoose.Types.ObjectId(leadId) : leadId;
    
    // Fetch lead using native collection to avoid any validation
    const LeadCollection = Lead.collection;
    const leadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    
    if (!leadDoc) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Convert MongoDB document to plain object
    const lead = {
      ...leadDoc,
      _id: leadDoc._id.toString()
    };

    // Normalize status immediately after fetching to prevent validation errors
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    const statusMap = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };
    
    let normalizedStatus = lead.status;
    if (lead.status && !validStatuses.includes(lead.status)) {
      normalizedStatus = statusMap[lead.status] || 'new';
      console.log(`Normalizing status from '${lead.status}' to '${normalizedStatus}'`);
      // Update the status in the database directly using native collection to prevent validation errors
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        { $set: { status: normalizedStatus } }
      );
      // Update the lead object in memory
      lead.status = normalizedStatus;
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    console.log("Seller : " , seller)

    // Check if total sqft is <= 50 and seller already purchased this lead
    if (lead.totalSqft <= 50) {
      console.log("Yes less than 50")
      const alreadyPurchased = lead.seller.some(s => s.sellerId.toString() === sellerId.toString());
      console.log("alreadyPurchased : " , alreadyPurchased )
      if (alreadyPurchased) {
        return res.status(400).json({
          success: false,
          // message: 'You have already purchased this small lead (≤ 50 sqft). Duplicate purchase is not allowed.'
          message: 'You can only purchase this lead once'
          // have already purchased this small lead (≤ 50 sqft). Duplicate purchase is not allowed.'
        });
      }
    }

     // Verify the seller has enough remaining quota if using free quota
    // if (useFreeQuota) {
    //   // const seller = await Seller.findById(req.sellerId);
    //   if (seller.freeQuota.currentMonthQuota < freeSqftToUse) {
    //     return res.status(400).json({ 
    //       success: false,
    //       message: 'Not enough free quota remaining'
    //     });
    //   }
      
    //   // Deduct the freeSqftToUse from the seller's quota
    //   seller.freeQuota.currentMonthQuota -= freeSqftToUse;
    //   await seller.save();
    // }

    // Check quota reset
    const now = new Date();
    if (now >= seller.freeQuota.nextResetDate) {
      seller.freeQuota.currentMonthQuota = 500;
      seller.freeQuota.usedQuota = 0;
      seller.freeQuota.nextResetDate = new Date(now);
      seller.freeQuota.nextResetDate.setMonth(now.getMonth() + 1);
      await seller.save();
    }

    // Calculate pricing
    const pricePerSqft = lead.basePricePerSqft; // 10.5
    const leadSqft = lead.totalSqft;
    const totalSqft = leadSqft * slotsToBuy;
    let freeSqftUsed = 0;
    let paidSqft = totalSqft;
    let actualPrice = paidSqft * pricePerSqft;

    if (useFreeQuota && seller.freeQuota.currentMonthQuota > 0) {
      // Check if already used quota for this lead
      const alreadyUsed = seller.quotaUsage.some(u => u.leadId.equals(leadId));
      
      if (!alreadyUsed) {
        // Calculate maximum free sqft (max 100 per transaction)
        // freeSqftUsed = Math.min(100, seller.freeQuota.currentMonthQuota, leadSqft);
        
        paidSqft = totalSqft - freeSqftToUse;
        actualPrice = paidSqft * pricePerSqft;
        console.log("Deatils : " ,freeSqftToUse , paidSqft , actualPrice)
        // return
        // Update seller's quota
        seller.freeQuota.currentMonthQuota -= freeSqftToUse;
        seller.freeQuota.usedQuota += freeSqftToUse;
        
        // Record quota usage
        seller.quotaUsage.push({
          leadId,
          sqftUsed: freeSqftToUse,
          date: now
        });
      }
    }

    const sellersInCity = await Seller.find({ 
      city: lead.projectInfo.address.city,
      status: 'approved',
      isActive: true
    });

    const brandCounts = {};
    sellersInCity.forEach(seller => {
      if (seller.brandOfProfileUsed) {
        brandCounts[seller.brandOfProfileUsed] = 
          (brandCounts[seller.brandOfProfileUsed] || 0) + 1;
      }
    });

    const brandsAtLimit = Object.entries(brandCounts)
      .filter(([_, count]) => count >= 2)
      .map(([brand]) => brand);

    if (brandsAtLimit.includes(seller.brandOfProfileUsed)) {
      return res.status(400).json({
        success: false,
        message: `Oops you have missed the bus by a whisker. Your brand in your city is already registered by 2 other fabricators.`,
        brandsAtLimit
      });
    }
 
    const pricePerSlot = actualPrice / slotsToBuy;
    const freePerSlot = freeSqftToUse / slotsToBuy;

    // slotsToBuy=6


    // Build the new seller array (avoid modifying lead object directly)
    const newSellers = [...(lead.seller || [])];
    for (let i = 0; i < slotsToBuy; i++) {
      newSellers.push({ 
        sellerId,
        purchasedAt: now,
        pricePaid: pricePerSlot,
        freeQuotaUsed: freePerSlot, // Distributed evenly but from single 100 limit
      });
    }

    const newAvailableSlots = lead.availableSlots - slotsToBuy;
    
    // Determine final status
    let finalStatus = normalizedStatus;
    if (newAvailableSlots === 0) {
      finalStatus = 'in-progress';
    }

    // Ensure status is valid (redefine statusMap and validStatuses for this scope)
    const validStatusesForUpdate = ['new', 'in-progress', 'closed', 'cancelled'];
    const statusMapForUpdate = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };
    
    if (finalStatus && !validStatusesForUpdate.includes(finalStatus)) {
      finalStatus = statusMapForUpdate[finalStatus] || 'new';
    }

    // Avoid duplicate entries in seller.leads
    if (!seller.leads.includes(leadId)) {
      seller.leads.push(leadId);
    }

    // Use updateOne with runValidators: false to bypass validation completely
    // This prevents errors if status was invalid in the database
    console.log('Updating lead with status:', finalStatus);
    console.log('Valid statuses:', validStatusesForUpdate);
    console.log('Status is valid:', validStatusesForUpdate.includes(finalStatus));
    
    // Ensure finalStatus is definitely valid
    if (!validStatusesForUpdate.includes(finalStatus)) {
      finalStatus = statusMapForUpdate[finalStatus] || 'new';
      console.log('Final status normalized to:', finalStatus);
    }
    
    const updateData = {
      $set: {
        seller: newSellers,
        price: price,
        availableSlots: newAvailableSlots,
        status: finalStatus
      }
    };

    // Use MongoDB's native collection to bypass Mongoose validation completely
    // This ensures no validation errors even if status was invalid
    console.log('Updating lead with native collection:', {
      leadId: leadObjectId,
      finalStatus,
      updateData
    });
    
    try {
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        updateData
      );
      console.log('Lead updated successfully using native collection');
    } catch (updateError) {
      console.error('Error updating lead with native collection:', updateError);
      throw updateError;
    }
    
    // Fetch the updated lead using native collection to avoid any validation
    const updatedLeadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    
    // Convert MongoDB document to plain object
    const updatedLead = updatedLeadDoc ? {
      ...updatedLeadDoc,
      _id: updatedLeadDoc._id.toString()
    } : null;
    
    // Normalize status in the fetched lead if needed (safety check)
    if (updatedLead && updatedLead.status && !validStatusesForUpdate.includes(updatedLead.status)) {
      console.log('Warning: Fetched lead still has invalid status:', updatedLead.status);
      const correctedStatus = statusMapForUpdate[updatedLead.status] || 'new';
      // Update it again using native collection
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        { $set: { status: correctedStatus } }
      );
      // Update the object in memory
      updatedLead.status = correctedStatus;
    }
    
    // Save seller
    await seller.save();
    
    res.status(200).json({
      success: true,
      message: 'Lead purchased successfully',
      lead: updatedLead || lead,
      actualPricePaid: actualPrice,
      freeSqftUsed: freeSqftToUse,
      paidSqft: paidSqft,
      pricePerSqft: pricePerSqft,
      // monthlyQuotaRemaining: seller.freeQuota.currentMonthQuota
    });

  } catch (error) {
    console.error('Error purchasing lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update lead status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { leadId, status } = req.body;

    // Valid status values from Lead schema
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    
    // Map frontend status values to schema values
    const statusMap = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };

    // Normalize status: if it's in the map, use the mapped value, otherwise use as-is
    let normalizedStatus = statusMap[status] || status;

    // Validate status
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
        received: status,
        normalized: normalizedStatus
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { status: normalizedStatus },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      lead
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Calculate price for a lead (utility endpoint)
exports.calculateLeadPrice = async (req, res) => {
  try {
    const { quotes } = req.body;

    if (!quotes || !Array.isArray(quotes)) {
      return res.status(400).json({
        success: false,
        message: 'Quotes array is required'
      });
    }

    // Calculate total square feet
    const totalSqft = quotes.reduce((total, quote) => {
      const sqft = (quote.height * quote.width * quote.quantity) / 144;
      return total + sqft;
    }, 0);

    // Calculate price per square foot
    const pricePerSqft = 6250 / (totalSqft * 6);

    res.status(200).json({
      success: true,
      totalSqft,
      pricePerSqft
    });
  } catch (error) {
    console.error('Error calculating lead price:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getSellerQuota = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('freeQuota');
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    seller.checkQuotaReset();
    if (seller.isModified()) await seller.save();

    res.json({
      success: true,
      remainingQuota: seller.freeQuota?.currentMonthQuota,
      nextReset: seller.freeQuota?.nextResetDate
    });
  } catch (error) {
    console.error('Error fetching seller quota:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};