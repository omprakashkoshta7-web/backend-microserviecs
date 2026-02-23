const { Product } = require('./models');
const { mongoose } = require('./db');

const curatedSareeProducts = [
  {
    name: 'Royal Banarasi Silk Saree',
    description: 'Rich Banarasi-inspired saree with classic zari style for festive and wedding occasions.',
    image: 'https://th.bing.com/th/id/OIP.Vhw4sI7_0d2FjigP6W2KjQHaKH?w=186&h=255&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 4999,
    originalPrice: 6999,
    discount: 29,
    rating: 4.7,
    reviews: 138,
    sold: 920,
  },
  {
    name: 'Heritage Kanjivaram Pattern Saree',
    description: 'Traditional silk-look saree with elegant pallu and temple-style border detailing.',
    image: 'https://th.bing.com/th/id/OIP.s5q1ape_TbvunjPIH8RDfwHaRo?w=147&h=350&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 5599,
    originalPrice: 7499,
    discount: 25,
    rating: 4.6,
    reviews: 112,
    sold: 880,
  },
  {
    name: 'Elegant Georgette Party Saree',
    description: 'Flowy georgette-style saree for party wear, designed for a graceful drape.',
    image: 'https://th.bing.com/th/id/OIP.6vRosBqztM6p-ehC_C4ImgHaLH?w=186&h=279&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 3299,
    originalPrice: 4599,
    discount: 28,
    rating: 4.5,
    reviews: 96,
    sold: 840,
  },
  {
    name: 'Classic Designer Silk Blend Saree',
    description: 'Refined silk-blend saree with statement color contrast for festive styling.',
    image: 'https://th.bing.com/th/id/OIP.mN_EBqy35HAJPDG_auKrAAHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 4299,
    originalPrice: 5899,
    discount: 27,
    rating: 4.4,
    reviews: 84,
    sold: 790,
  },
  {
    name: 'Floral Festive Saree',
    description: 'Modern festive saree with soft pattern work, ideal for celebrations and events.',
    image: 'https://th.bing.com/th/id/OIP.55Hgx9ce8Z32PXiAfMs-LgHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 2899,
    originalPrice: 3999,
    discount: 28,
    rating: 4.3,
    reviews: 71,
    sold: 740,
  },
  {
    name: 'Handloom Style Cotton Saree',
    description: 'Lightweight cotton-inspired saree crafted for comfort and all-day traditional wear.',
    image: 'https://tse4.mm.bing.net/th/id/OIP.chXP-FGSXZTtIFt0j3nEagAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
    price: 2199,
    originalPrice: 3199,
    discount: 31,
    rating: 4.5,
    reviews: 88,
    sold: 700,
  },
  {
    name: 'Premium Wedding Saree',
    description: 'Premium wedding collection saree with rich look and occasion-ready finish.',
    image: 'https://th.bing.com/th/id/OIP.x-kiUvhHn0breSnbozGQfQHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 6499,
    originalPrice: 8599,
    discount: 24,
    rating: 4.8,
    reviews: 154,
    sold: 970,
  },
];

const curatedBangleProducts = [
  {
    name: 'Rose Gold Crystal Bangles Set',
    description: 'Elegant rose-gold tone bangles with crystal detailing for festive and party wear.',
    image: 'https://th.bing.com/th/id/OIP.q7VTK1IVM0SyaAs6Zx2xMwHaEJ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
    price: 1899,
    originalPrice: 2999,
    discount: 37,
    rating: 4.6,
    reviews: 142,
    sold: 640,
  },
  {
    name: 'Traditional Kundan Bangles',
    description: 'Classic kundan-style bangles crafted for wedding and ethnic looks.',
    image: 'https://th.bing.com/th/id/OIP.j9Q9PkhYvxlcrQeyq6VF-gHaG4?w=210&h=196&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 2299,
    originalPrice: 3499,
    discount: 34,
    rating: 4.7,
    reviews: 168,
    sold: 690,
  },
  {
    name: 'Antique Designer Bangle Pair',
    description: 'Antique-finish designer bangles with intricate motif work and rich premium look.',
    image: 'https://th.bing.com/th/id/OIP.ubUW1IAkxBRdrLUfF2hWlQHaE7?w=263&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 2099,
    originalPrice: 3299,
    discount: 36,
    rating: 4.5,
    reviews: 121,
    sold: 610,
  },
  {
    name: 'Floral Ethnic Bangles Set',
    description: 'Floral-inspired ethnic bangles set for celebrations, pooja, and daily traditional styling.',
    image: 'https://th.bing.com/th/id/OIP.Rpmr205ieSTWJTguOWnrtwHaGZ?w=219&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 1599,
    originalPrice: 2599,
    discount: 38,
    rating: 4.4,
    reviews: 96,
    sold: 560,
  },
  {
    name: 'Premium Stonework Bangles',
    description: 'Premium stonework bangles with polished finish for festive and bridal occasions.',
    image: 'https://th.bing.com/th/id/OIP.aVwaAvxd3o7Kgn448aWaeAHaHa?w=187&h=194&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
    price: 2499,
    originalPrice: 3899,
    discount: 36,
    rating: 4.8,
    reviews: 184,
    sold: 730,
  },
];

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

    for (const saree of curatedSareeProducts) {
      await Product.updateOne(
        { image: saree.image },
        {
          $set: {
            ...saree,
            category: 'Clothes',
            subCategory: 'Sarees',
            subcategory: 'Sarees',
            images: [saree.image],
            inStock: true,
            stock: 40,
            isPopular: true,
            isTrending: true,
            tags: ['saree', 'ethnic', 'traditional'],
          },
        },
        { upsert: true }
      );
    }

    for (const bangle of curatedBangleProducts) {
      await Product.updateOne(
        { image: bangle.image },
        {
          $set: {
            ...bangle,
            category: 'Accessories',
            subCategory: 'Bangles',
            subcategory: 'Bangles',
            images: [bangle.image],
            inStock: true,
            stock: 60,
            isTrending: true,
            isPopular: true,
            tags: ['bangles', 'jewelry', 'ethnic'],
          },
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.log('Could not initialize products:', error.message);
  }
};

module.exports = { initializeProducts };
