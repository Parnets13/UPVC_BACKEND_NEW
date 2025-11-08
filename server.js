//server.js
const http = require('http');
const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();                   

const PORT = process.env.PORT || 9000; 


const server = http.createServer(app);

server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
