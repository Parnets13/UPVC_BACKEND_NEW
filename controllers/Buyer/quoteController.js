const Quote = require('../../models/Buyer/Quote');
const WindowSubOption = require('../../models/Admin/WindowSubOptions');
const User = require('../../models/Buyer/User');
const jwt = require('jsonwebtoken');
const Lead = require('../../models/Admin/lead');

// Create a new quote item 
exports.createQuote = async (req, res) => {
  try {
    const { productType, product, color, installationLocation, height, width, quantity, remark } = req.body;

    // Validate product exists
    const productExists = await WindowSubOption.findById(product);
    if (!productExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const quote = new Quote({
      buyer: req.user._id,
      productType,
      product,
      color,
      installationLocation,
      height,
      width,
      quantity,
      remark
    });

    await quote.save();

    res.status(201).json({
      success: true,
      message: 'Quote item added successfully',
      quote
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all quotes for a buyer
exports.getBuyerQuotes = async (req, res) => {
  try { 
    const quotes = await Quote.find({ buyer: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalSqft = quotes.reduce((sum, quote) => sum + quote.sqft, 0);
    const totalQuantity = quotes.reduce((sum, quote) => sum + quote.quantity, 0);
    const pricePerSqft = 6250 / (totalSqft * 6);

    res.status(200).json({
      success: true,
      count: quotes.length,
      totalSqft,
      totalQuantity,
      pricePerSqft,
      quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a quote item
exports.updateQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const updateData = req.body;

    // If product is being updated, validate it exists
    if (updateData.product) {
      const productExists = await WindowSubOption.findById(updateData.product);
      if (!productExists) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
    }

    const quote = await Quote.findByIdAndUpdate(
      quoteId,
      updateData,
      { new: true, runValidators: true }
    ).populate('product');

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Quote updated successfully',
      quote
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a quote item
exports.deleteQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await Quote.findByIdAndDelete(quoteId);

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Convert quotes to lead
exports.convertToLead = async (req, res) => {
  try {
    const { buyerId, contactInfo, projectInfo, categoryId } = req.body;

    // Get all quotes for this buyer
    const quotes = await Quote.find({ buyer: buyerId });
    if (quotes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No quotes found to convert to lead' 
      });
    }

    // Prepare quotes for lead
    const leadQuotes = quotes.map(quote => ({
      productType: quote.productType,
      product: quote.product,
      color: quote.color,
      installationLocation: quote.installationLocation,
      height: quote.height,
      width: quote.width,
      quantity: quote.quantity,
      remark: quote.remark,
      sqft: quote.sqft
    }));

    // Calculate totals
    const totalSqft = leadQuotes.reduce((sum, quote) => sum + quote.sqft, 0);
    const totalQuantity = leadQuotes.reduce((sum, quote) => sum + quote.quantity, 0);
    const pricePerSqft = 6250 / (totalSqft * 6);

    // Create lead (you'll need to import your Lead model)
    const lead = new Lead({
      buyer: buyerId,
      quotes: leadQuotes,
      contactInfo,
      projectInfo,
      category: categoryId,
      totalSqft,
      totalQuantity,
      pricePerSqft
    });

    await lead.save();

    // Optionally delete the quotes after creating lead
    await Quote.deleteMany({ buyer: buyerId });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully from quotes',
      lead
    });
  } catch (error) {
    console.error('Error converting quotes to lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};







// Add item to cart (quote)
// exports.addToCart = async (req, res) => {
//   try {
//     const { productType, product, color, installationLocation, height, width, quantity, remark } = req.body;

//     // Validate product exists
//     const productExists = await WindowSubOption.findById(product);
//     if (!productExists) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Product not found' 
//       });
//     }

//     // Check if same product already exists in cart
//     const existingItem = await Quote.findOne({ 
//       buyer: req.user._id,
//       product,
//       color,
//       installationLocation,
//       height,
//       width
//     });

//     if (existingItem) {
//       // Update quantity if item exists
//       existingItem.quantity += quantity;
//       await existingItem.save();
      
//       return res.status(200).json({
//         success: true,
//         message: 'Cart item quantity updated',
//         quote: existingItem
//       });
//     }

//     // Create new cart item
//     const quote = new Quote({
//       buyer: req.user._id,
//       productType,
//       product,
//       color,
//       installationLocation,
//       height,
//       width,
//       quantity,
//       remark
//     });

//     await quote.save();

//     res.status(201).json({
//       success: true,
//       message: 'Item added to cart successfully',
//       quote
//     });
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.addToCart = async (req, res) => {
  try {
    const { productType, product, color, installationLocation, height, width, quantity, remark } = req.body;

    // Validate product exists
    const productExists = await WindowSubOption.findById(product);
    if (!productExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const newItem = {
      productType,
      product,
      color,
      installationLocation,
      height,
      width,
      quantity,
      remark
    };

    // Find or create cart for buyer, add item
    const cart = await Quote.findOneAndUpdate(
      { buyer: req.user._id },
      { 
        $push: { items: newItem },
        $setOnInsert: { buyer: req.user._id } // Create if doesn't exist
      },
      { new: true, upsert: true }
    ).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get cart items
exports.getCart = async (req, res) => {
  try { 
    const quotes = await Quote.find({ buyer: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 })
   

    // Calculate cart totals
    const totalSqft = quotes.reduce((sum, quote) => sum + quote.sqft, 0);
    const totalQuantity = quotes.reduce((sum, quote) => sum + quote.quantity, 0);
    const estimatedPrice = totalSqft * 10.5; // Using base price per sqft

    res.status(200).json({
      success: true,
      count: quotes.length,
      totalSqft,
      totalQuantity,
      estimatedPrice,
      items: quotes
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const updateData = req.body;

    // Find the cart item
    const quote = await Quote.findOne({
      _id: quoteId,
      buyer: req.user._id
    });

    if (!quote) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart item not found' 
      });
    }

    // If product is being updated, validate it exists
    if (updateData.product) {
      const productExists = await WindowSubOption.findById(updateData.product);
      if (!productExists) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }
    }

    // Update the item
    Object.assign(quote, updateData);
    await quote.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      quote
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await Quote.findOneAndDelete({
      _id: quoteId,
      buyer: req.user._id
    });

    if (!quote) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart item not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    await Quote.deleteMany({ buyer: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Convert cart to lead
exports.convertCartToLead = async (req, res) => {
  try {
    const { contactInfo, projectInfo, categoryId } = req.body;

    // Get all cart items
    const cartItems = await Quote.find({ buyer: req.user._id });
    if (cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your cart is empty' 
      });
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Prepare quotes for lead
    const leadQuotes = cartItems.map(item => ({
      productType: item.productType,
      product: item.product,
      color: item.color,
      installationLocation: item.installationLocation,
      height: item.height,
      width: item.width,
      quantity: item.quantity,
      remark: item.remark,
      sqft: item.sqft
    }));

    // Calculate totals
    const totalSqft = leadQuotes.reduce((sum, quote) => sum + quote.sqft, 0);
    const totalQuantity = leadQuotes.reduce((sum, quote) => sum + quote.quantity, 0);

    // Create lead
    const lead = new Lead({
      buyer: req.user._id,
      quotes: leadQuotes,
      contactInfo,
      projectInfo,
      category: categoryId,
      totalSqft,
      totalQuantity,
      basePricePerSqft: 10.5
    });

    await lead.save();

    // Clear the cart after creating lead
    await Quote.deleteMany({ buyer: req.user._id });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully from cart',
      lead
    });
  } catch (error) {
    console.error('Error converting cart to lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};