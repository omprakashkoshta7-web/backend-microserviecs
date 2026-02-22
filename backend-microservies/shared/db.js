const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      dbName: 'ecommerce',
    };

    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, options);
    console.log('MongoDB Connected');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Using mock data for development');
  }
};

module.exports = {
  mongoose,
  connectDB,
};
