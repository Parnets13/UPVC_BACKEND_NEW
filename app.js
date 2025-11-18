const path = require('path');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express(); 

// CORS configuration - allow specific origins
const allowedOrigins = [
  'https://upvc-admin-panel.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  // Add more origins as needed
];

// CORS middleware with dynamic origin
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins
      callback(null, true);
    } else {
      // In production, allow all origins for now (can be tightened later)
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// CORS middleware handles preflight requests automatically
// No need for explicit app.options('*') handler

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n=== INCOMING REQUEST ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Body:`, req.body);
  console.log(`========================\n`);
  next();
});

// Increase body parser limits for large file uploads (videos can be large)
app.use(express.json({ limit: '1gb' }));  
app.use(express.urlencoded({ extended: true, limit: '1gb' })); 

// Serve static files from the 'uploads' directory
// Makes uploaded files accessible via URL like: http://yourserver/uploads/filename.jpg
// Set options to properly handle range requests for video streaming
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Enable range requests for video files
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));
 
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}); 

app.use('/api/auth', require('./routes/Buyer/authRoutes'));   
app.use('/api/buyer', require('./routes/Buyer/authRoutes'));
app.use('/api/admin', require('./routes/Admin/authRoutes'));
app.use('/api/banner', require('./routes/Admin/bannerRoutes'));
app.use('/api/homepage', require('./routes/Admin/Homepage')); 
app.use('/api/pricing', require('./routes/Admin/pricingRoutes'));
app.use('/api/feedback', require('./routes/Buyer/feedbackRoutes'));
app.use('/api/color' , require('./routes/Buyer/colorRoutes'));
app.use('/api/options',require('./routes/Admin/optionRoutes'));
app.use('/api/sub-options',require('./routes/Admin/subOptionsRoutes'));
app.use('/api/contact', require('./routes/Buyer/contactRoutes')); 
app.use('/api/advertisments', require('./routes/Admin/advertisement')); 
app.use('/api/buyer/advertisments', require('./routes/Admin/buyerAdvertisement')); 

app.use('/api/categories', require('./routes/Admin/categoryRoutes'));
app.use('/api/subcategories', require('./routes/Admin/subCategoryRoutes'));

app.use('/api/seller/managment', require('./routes/Admin/sellerManagement'));
app.use('/api/seller/lead', require('./routes/Admin/lead'));
app.use('/api/admin', require('./routes/Admin/buyerManagement'));

app.use('/api/sellers', require('./routes/Seller/sellerRoutes')); 
app.use('/api/quotes', require('./routes/Buyer/quoteRoutes'));

// Serve static files from the 'build' directory (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get("*", (req, res) => {
  return  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;