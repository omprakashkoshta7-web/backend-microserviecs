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
  // Original curated images
  'https://th.bing.com/th/id/OIP.Vhw4sI7_0d2FjigP6W2KjQHaKH?w=186&h=255&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.s5q1ape_TbvunjPIH8RDfwHaRo?w=147&h=350&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.6vRosBqztM6p-ehC_C4ImgHaLH?w=186&h=279&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.mN_EBqy35HAJPDG_auKrAAHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.55Hgx9ce8Z32PXiAfMs-LgHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://tse4.mm.bing.net/th/id/OIP.chXP-FGSXZTtIFt0j3nEagAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://th.bing.com/th/id/OIP.x-kiUvhHn0breSnbozGQfQHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  // New unique party wear sarees
  'http://gunjfashion.com/cdn/shop/files/beige-sequins-embroidered-party-wear-saree-in-organza_2.jpg',
  'http://mysilklove.com/cdn/shop/files/22_d17eddab-0571-4be6-8606-16c641e5f081.jpg',
  'https://www.fabfunda.com/product-img/women-charming-party-wear-oran-1721123762.jpeg',
  'https://assets.myntassets.com/w_360,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2025/MAY/19/E0UQb9jL_e8320cf45780408a8e51cfb3d73ba5e9.jpg',
  'https://cdn.shopaccino.com/nakhrali/products/23-89419750967879_l.jpg',
  'https://www.latestkurtidesigns.com/wp-content/uploads/2024/04/Rainbow-Silk.jpg',
  'https://royalanarkali.com/wp-content/uploads/2020/11/party-wear-georgette-sequence-work-saree-for-womens-red.jpg',
  'http://vootbuy.in/cdn/shop/products/free-01skf-priyanshi-kastbhanjan-fashion-unstitched-original-imagent4zy8ybfz5.webp',
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
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));

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
    const products = await Product.find({
      category: 'Beauty',
      isHighQuality: true
    })
    .select('name price originalPrice discount image images category subcategory rating reviews description inStock brand stock sold tags colors isHighQuality createdAt')
    .limit(30)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

    console.log(`✨ High Quality Beauty: ${products.length} products (sorted by newest first)`);
    res.json(products);
  } catch (error) {
    console.error('High Quality Beauty API error:', error);
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
    // 12 New Saree Image Links - Show these ONLY
    const new12SareeImages = [
      'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSZm4O4bfg6j1A2N30qDAm0aR9hQ3Y5YZC7k25rCawpjg6B3TSLq945YxDNE5lJCXgXsXtLxdHXXwVEjVp87sLMrmM4VR4_g5VtbuKYrc05N_WOjzrCdRA7lnk',
      'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTxD4mtz10WG2nuq7arFIwZ9ti8NCVOJ5c6bZXOmu_RESMpBlVD458euwRk3L1eCLlqjSt43NcYkOxh8-NzMHFkoAq4zEubZfvE8ziIXAXj',
      'https://sureenachowdhri.com/cdn/shop/files/10_5d293c23-94ef-4222-80b3-b51e5282b15f.jpg?v=1751986068&width=3000',
      'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRfQSlVsC7AfnqIROfyDB_4RA7iE2a43Jzc2KkS4MZCNadx6PUyBVq8Jrsc4d9gZu7w08wZcjdPfHZiYHBqDVgMYxPqv7GnRbxl12250vNVLkaDQbv4v0VL',
      'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRU8V_872kKsO5P4fkBq_f5bG9aXwWxbP-A5MqzasBh3NrXLZVFPcGFV8K04E4iNZgXqKm8dvEYw0S9Ss6wyvIQK8iEx_JM97sopAED15bvxbRbCetQE9GzjA',
      'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSBWN1fhZCYfd8IZXtzDH1m88Pmho0DYCWQ4LWRByEFpH5Ez0T0aJxeHuGr79EBQ6SxcekWMb8nwb_jBVyiBIk7t5UiZ2WYsnLFrSAuGvalACChGB2Ws16Q',
      'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTGnjml36auw-9frHZuHfUbM7sigcOTSSBl8A5fgciDzd0rfBibE9bpmMYTeyXi4_Ix9OI59moEtzPP65QMYm9kwfYyJCMS8lmVNw-VT_qErH3n-aW466Z8Fw',
      'https://static.wixstatic.com/media/faf1ba_78c7a05c62a24c61a99d18980455fc89~mv2.jpg/v1/fill/w_526,h_692,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/faf1ba_78c7a05c62a24c61a99d18980455fc89~mv2.jpg',
      'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6471ab9b79337900129b7293/cat_img/mNjM1qnR_BZK0OIG227_2025-07-29_1.png',
      'https://laxvani.com/cdn/shop/files/1-Photoroom_92e878f4-bcd8-4f31-b778-91a598ecbe18.png?v=1763395818&width=823',
      'https://www.rozinaa.com/cdn/shop/files/IMG_0395.png?v=1764841509&width=533',
      'https://www.rozinaa.com/cdn/shop/files/IMG_1735.png?v=1766978146&width=990'
    ];

    // Fetch ONLY products with these 12 image links
    const products = await Product.find({
      image: { $in: new12SareeImages }
    })
      .sort({ createdAt: -1 }) // Newest first
      .limit(12)
      .lean()
      .exec();

    console.log(`🔥 Most Popular: ${products.length} sarees (12 NEW sarees ONLY)`);
    res.json(products);
  } catch (error) {
    console.error('Most Popular API error:', error);
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
