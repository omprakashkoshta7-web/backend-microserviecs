const { Product } = require('./models');
const { mongoose } = require('./db');

const initializeProducts = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, skipping product initialization');
      return;
    }

    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        {
          name: 'Nike Air Max 1',
          price: 8999,
          image: 'https://via.placeholder.com/150',
          category: 'Shoes',
          rating: 4.5,
          reviews: 102,
          description: 'Premium quality Nike Air Max shoes with excellent comfort.',
          inStock: true,
        },
        {
          name: 'Nike Air Max 2',
          price: 9499,
          image: 'https://via.placeholder.com/150',
          category: 'Shoes',
          rating: 4.8,
          reviews: 85,
          description: 'Latest Nike Air Max collection.',
          inStock: true,
        },
        {
          name: 'Adidas Ultraboost',
          price: 12999,
          image: 'https://via.placeholder.com/150',
          category: 'Shoes',
          rating: 4.7,
          reviews: 120,
          description: 'Comfortable running shoes.',
          inStock: true,
        },
        {
          name: 'Puma RS-X',
          price: 7999,
          image: 'https://via.placeholder.com/150',
          category: 'Shoes',
          rating: 4.3,
          reviews: 65,
          description: 'Stylish casual shoes.',
          inStock: true,
        },
      ]);
      console.log('Sample products initialized');
    } else {
      console.log(`Found ${count} products in database`);
    }
  } catch (error) {
    console.log('Could not initialize products:', error.message);
  }
};

module.exports = { initializeProducts };
