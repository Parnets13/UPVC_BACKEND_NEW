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
      // In production, only allow specific origins
      // For now, allow all for flexibility - tighten this later
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  // When credentials: true, we must use the actual origin, not '*'
  // Check if origin is allowed or allow all in development
  if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
    // Use the actual origin if present, otherwise allow (for non-browser requests)
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, X-Requested-With, Accept');
    if (origin) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

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

app.use(express.json());  
app.use(express.urlencoded({ extended: true })); 

// Serve static files from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
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

app.use((req, res) => {
  res.status(404).json({ message: 'Route Not Found' });
});

module.exports = app;