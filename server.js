//server.js
const http = require('http');
const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();                   

const PORT = process.env.PORT || 9000; 


const server = http.createServer(app);

server.listen(PORT,() => {
  console.log('\n========================================');
  console.log('🚀 SERVER STARTED SUCCESSFULLY 🚀');
  console.log('========================================');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('✅ Console logging is ACTIVE');
  console.log('✅ All logs will appear below this line');
  console.log('========================================\n');
});
