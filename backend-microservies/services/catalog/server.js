require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');

const { connectDB, mongoose } = require('../../shared/db');
const { Product, Review, Category } = require('../../shared/models');
const { authMiddleware } = require('../../shared/auth');
const { initializeProducts } = require('../../shared/initProducts');

const app = express();
const PORT = process.env.PORT || process.env.CATALOG_PORT || 5002;

const curatedSareeImages = [
  'https://th.bing.com/th/id/OIP.Vhw4sI7_0d2FjigP6W2KjQHaKH?w=186&h=255&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.s5q1ape_TbvunjPIH8RDfwHaRo?w=147&h=350&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.6vRosBqztM6p-ehC_C4ImgHaLH?w=186&h=279&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.mN_EBqy35HAJPDG_auKrAAHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.55Hgx9ce8Z32PXiAfMs-LgHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://tse4.mm.bing.net/th/id/OIP.chXP-FGSXZTtIFt0j3nEagAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://th.bing.com/th/id/OIP.x-kiUvhHn0breSnbozGQfQHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
];

const curatedBangleImages = [
  'https://th.bing.com/th/id/OIP.q7VTK1IVM0SyaAs6Zx2xMwHaEJ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://th.bing.com/th/id/OIP.j9Q9PkhYvxlcrQeyq6VF-gHaG4?w=210&h=196&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.ubUW1IAkxBRdrLUfF2hWlQHaE7?w=263&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.Rpmr205ieSTWJTguOWnrtwHaGZ?w=219&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.aVwaAvxd3o7Kgn448aWaeAHaHa?w=187&h=194&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
];

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/images', express.static(path.join(__dirname, '../../../public/images')));

connectDB()
  .then(() => {
    initializeProducts().catch((error) => {
      console.error('Product initialization failed:', error.message);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Catalog service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'catalog' });
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mockProducts = [
        {
          _id: '1',
          name: 'Nike Air Max 270',
          price: 8999,
          image: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Nike+Air+Max',
          category: 'Shoes',
          rating: 4.5,
          reviews: 102,
          description: 'Premium quality Nike Air Max shoes with excellent comfort and style.',
          inStock: true,
        },
      ];
      return res.json(mockProducts);
    }

    const { category, subCategory, minPrice, maxPrice, sortBy, isHighQuality, isPopular, diverse } = req.query;

    let query = {};
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOptions = {};
    if (sortBy === 'price_asc') sortOptions.price = 1;
    else if (sortBy === 'price_desc') sortOptions.price = -1;
    else if (sortBy === 'rating') sortOptions.rating = -1;
    else sortOptions.createdAt = -1;

    let products = await Product.find(query).sort(sortOptions);

    let filteredProducts = products;
    if (isHighQuality === 'true') {
      filteredProducts = filteredProducts.filter(p => p.tags && p.tags.includes('high-quality'));
    }
    if (isPopular === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isPopular);
    }

    if (diverse === 'true' && !category && !subCategory) {
      const categories = [...new Set(filteredProducts.map(p => p.category))];
      let diverseProducts = [];
      categories.forEach(cat => {
        const catProducts = filteredProducts.filter(p => p.category === cat);
        diverseProducts = diverseProducts.concat(catProducts.slice(0, 8));
      });
      filteredProducts = diverseProducts;
    }

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/popular/list', async (req, res) => {
  try {
    const products = await Product.find({ isPopular: true }).sort({ rating: -1 }).limit(20);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { subCategory: { $regex: q, $options: 'i' } },
      ],
    }).limit(50);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/high-quality-beauty', async (req, res) => {
  try {
    const products = await Product.find({ category: 'Beauty', isFeatured: true }).limit(20);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/trending-collection', async (req, res) => {
  try {
    // Trending Bangles section: prioritize curated bangle images first.
    const curated = await Product.find({
      image: { $in: curatedBangleImages },
    })
      .sort({ sold: -1, rating: -1, createdAt: -1 })
      .limit(20);

    const curatedIds = curated.map((p) => p._id);
    const remainingSlots = Math.max(20 - curated.length, 0);

    const bangleQuery = {
      $or: [
        { subcategory: { $regex: '^bangles?$', $options: 'i' } },
        { subCategory: { $regex: '^bangles?$', $options: 'i' } },
        { name: { $regex: 'bangle', $options: 'i' } },
      ],
    };

    if (curatedIds.length > 0) {
      bangleQuery._id = { $nin: curatedIds };
    }

    const otherBangles = remainingSlots
      ? await Product.find(bangleQuery)
          .sort({ sold: -1, rating: -1, createdAt: -1 })
          .limit(remainingSlots)
      : [];

    let products = [...curated, ...otherBangles];

    if (!products || products.length === 0) {
      products = await Product.find({
        isTrending: true,
        $or: [
          { subcategory: { $regex: '^bangles?$', $options: 'i' } },
          { subCategory: { $regex: '^bangles?$', $options: 'i' } },
          { name: { $regex: 'bangle', $options: 'i' } },
        ],
      })
        .sort({ sold: -1, rating: -1, createdAt: -1 })
        .limit(20);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/most-popular', async (req, res) => {
  try {
    const curated = await Product.find({
      image: { $in: curatedSareeImages },
    })
      .sort({ sold: -1, rating: -1, createdAt: -1 })
      .limit(20);

    const curatedIds = curated.map((p) => p._id);
    const remainingSlots = Math.max(20 - curated.length, 0);

    const sareeQuery = {
      $or: [
        { subcategory: { $regex: '^sarees?$', $options: 'i' } },
        { subCategory: { $regex: '^sarees?$', $options: 'i' } },
        { name: { $regex: 'saree', $options: 'i' } },
      ],
    };

    if (curatedIds.length > 0) {
      sareeQuery._id = { $nin: curatedIds };
    }

    const otherSarees = remainingSlots
      ? await Product.find(sareeQuery)
          .sort({ sold: -1, rating: -1, createdAt: -1 })
          .limit(remainingSlots)
      : [];

    let products = [...curated, ...otherSarees];

    if (!products || products.length === 0) {
      products = await Product.find({ isPopular: true })
        .sort({ sold: -1, rating: -1, createdAt: -1 })
        .limit(20);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    }).limit(8);

    res.json(related);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;

    const newReview = new Review({
      productId,
      userId: req.userId,
      rating,
      comment,
      userName,
    });

    await newReview.save();
    res.status(201).json({ message: 'Review added', review: newReview });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
