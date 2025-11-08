const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { 
    });
    // console.log(`MongoDB connected : ${conn.connection.host}`);
    console.log(`MongoDB connected`);
  } catch (err) {
    console.error(`DB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
