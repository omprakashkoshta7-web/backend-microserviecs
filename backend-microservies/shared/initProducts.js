const { Product } = require('./models');
const { mongoose } = require('./db');

const sareeImagePool = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=80',
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80',
  'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=900&q=80',
  'https://images.unsplash.com/photo-1583391733981-4745d9d52a79?w=900&q=80',
  'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=900&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&q=80',
  'https://th.bing.com/th/id/OIP.Vhw4sI7_0d2FjigP6W2KjQHaKH?w=186&h=255&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.s5q1ape_TbvunjPIH8RDfwHaRo?w=147&h=350&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.6vRosBqztM6p-ehC_C4ImgHaLH?w=186&h=279&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.x-kiUvhHn0breSnbozGQfQHaJ4?w=186&h=248&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
];

const bangleImagePool = [
  'https://th.bing.com/th/id/OIP.q7VTK1IVM0SyaAs6Zx2xMwHaEJ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://th.bing.com/th/id/OIP.j9Q9PkhYvxlcrQeyq6VF-gHaG4?w=210&h=196&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.ubUW1IAkxBRdrLUfF2hWlQHaE7?w=263&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.Rpmr205ieSTWJTguOWnrtwHaGZ?w=219&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.aVwaAvxd3o7Kgn448aWaeAHaHa?w=187&h=194&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.d-6GTXaMWMiU9CppoSElrgHaHa?w=209&h=209&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://th.bing.com/th/id/OIP.LDG7cXsCqGX50QypVq-FJgHaFM?w=275&h=193&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80',
  'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=900&q=80',
  'https://www.sanvijewels.com/cdn/shop/files/IMG_20230922_133843.jpg?v=1723881322&width=1920',
  'https://ishhaara.com/cdn/shop/files/ishhaara-bridal-rajwadi-bangle-set-with-jhumki-82097746725415.jpg?v=1728561944&width=1946',
  'https://maayajewellery.com/wp-content/uploads/2025/02/IMG_800.jpg',
];

const beautyImagePool = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=900&q=80',
  'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=900&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=900&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=900&q=80',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900&q=80',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=900&q=80',
  'https://m.media-amazon.com/images/I/61qZ8vQqZyL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61Z+vQqZyL._SL1500_.jpg',
  'https://i5.walmartimages.com/seo/NIVEA-Creme-Body-Face-and-Hand-Moisturizing-Cream-13-5-Oz-Jar_00880853-96a0-484a-9d7c-be653ef05acc.315b0db0cff6ae0a7dd134df9851d320.jpeg',
];

const sareeTemplates = [
  ['Royal Banarasi Silk Saree', 'Rich Banarasi-inspired saree with classic zari style for wedding and festive occasions.'],
  ['Heritage Kanjivaram Pattern Saree', 'Traditional south-silk inspired drape with temple border and elegant pallu.'],
  ['Elegant Georgette Party Saree', 'Lightweight georgette saree made for parties, receptions, and evening styling.'],
  ['Classic Designer Silk Blend Saree', 'Premium silk-blend saree with modern contrast pattern and refined finish.'],
  ['Floral Festive Saree', 'Soft festive saree featuring floral motifs and graceful drape for celebrations.'],
  ['Handloom Style Cotton Saree', 'Breathable cotton saree for all-day comfort and traditional everyday wear.'],
  ['Premium Wedding Saree', 'Occasion-ready premium saree with rich texture and bridal-inspired color tone.'],
  ['Chiffon Printed Saree', 'Flowy chiffon saree with modern print and elegant lightweight movement.'],
  ['Tussar Silk Saree', 'Textured tussar silk look saree with subtle sheen and classic ethnic charm.'],
  ['Organza Embroidery Saree', 'Sheer organza saree with delicate embroidery for elevated festive looks.'],
  ['Bandhani Traditional Saree', 'Traditional bandhani style saree inspired by timeless handcrafted aesthetics.'],
  ['Linen Minimal Saree', 'Minimal linen-style saree for office wear, events, and chic daily styling.'],
  ['Cotton Temple Border Saree', 'Temple-border cotton saree offering a perfect blend of comfort and heritage look.'],
  ['Zari Weave Occasion Saree', 'Intricate zari weave inspired saree designed for special ceremonies.'],
  ['Designer Sequin Saree', 'Shimmer sequin detailing saree crafted for engagement and festive nights.'],
  ['Pastel Festive Silk Saree', 'Pastel palette silk-inspired saree with soft festive sophistication.'],
  ['Classic South Weave Saree', 'Traditional weave inspired saree with rich pallu and authentic finish.'],
  ['Evening Glam Saree', 'Party-ready saree with polished styling and graceful drape.'],
  ['Ethnic Printed Saree', 'Ethnic print saree tailored for modern traditional wardrobes.'],
  ['Bridal Tone Saree', 'Bridal-tone saree curated for wedding events and premium gatherings.'],
  ['Daily Wear Elegant Saree', 'Comfort-focused saree suitable for daily ethnic wear with elegant appeal.'],
  ['Luxury Border Saree', 'Luxury border design saree crafted for statement festive dressing.'],
  ['Traditional Artisan Saree', 'Artisan-inspired saree with classic pattern and timeless silhouette.'],
  ['Festive Collection Saree', 'Festive collection saree with rich look and versatile occasion styling.'],
];

const bangleTemplates = [
  ['Rose Gold Crystal Bangles Set', 'Elegant rose-gold bangles with crystal accents for festive and party styling.'],
  ['Traditional Kundan Bangles', 'Classic kundan bangles designed for wedding and ethnic outfit pairing.'],
  ['Antique Designer Bangle Pair', 'Antique-finish bangles with detailed motifs and premium traditional look.'],
  ['Floral Ethnic Bangles Set', 'Floral-inspired bangles set perfect for pooja and festive celebrations.'],
  ['Premium Stonework Bangles', 'Premium stonework bangles with polished finish for bridal occasions.'],
  ['Gold Plated Bridal Bangles', 'Gold plated bangle set designed for bridal and reception wear.'],
  ['Temple Design Bangles', 'Temple design bangles with heritage-inspired craftsmanship.'],
  ['Polki Style Bangles', 'Statement polki-style bangles for grand festive and wedding outfits.'],
  ['Pearl Work Bangles', 'Pearl embellished bangles giving elegant and soft premium finish.'],
  ['Mirror Work Bangles', 'Mirror-work bangle set with vibrant ethnic shine for celebrations.'],
  ['Rajwadi Bangles Set', 'Rajwadi inspired traditional bangles with royal design language.'],
  ['Mehendi Function Bangles', 'Color-rich bangles specially curated for mehendi and sangeet events.'],
  ['Festive Kangan Pair', 'Classic festive kangan pair with comfortable daily festive fit.'],
  ['Designer Party Bangles', 'Designer party bangles with modern ethnic detailing.'],
  ['Classic Wedding Chooda Style', 'Wedding chooda-inspired bangle set with ceremonial look.'],
  ['Handcrafted Metal Bangles', 'Handcrafted metal bangles balancing tradition with modern styling.'],
  ['Stone Studded Bangles', 'Stone studded bangles for high-impact festive and party dressing.'],
  ['Premium Bridal Kangan', 'Premium bridal kangan set with statement handcrafted finish.'],
  ['Glossy Enamel Bangles', 'Glossy enamel bangles in vibrant tones for ethnic outfits.'],
  ['Minimal Daily Bangles', 'Minimal bangles set designed for everyday ethnic elegance.'],
  ['Occasion Wear Bangles', 'Occasion wear bangles made for wedding and festival wardrobes.'],
  ['Silver Tone Ethnic Bangles', 'Silver-tone ethnic bangles with elegant festive charm.'],
  ['Traditional Celebration Bangles', 'Traditional bangle set curated for cultural celebrations.'],
  ['Luxury Wedding Bangles', 'Luxury wedding bangle set with premium festive finish.'],
];

const beautyTemplates = [
  ['Vitamin C Glow Serum', 'Skincare', 'Brightening vitamin C serum for glow and even skin texture.'],
  ['Hydrating Face Wash', 'Skincare', 'Gentle hydrating cleanser for fresh, clean, and soft skin.'],
  ['Niacinamide Repair Cream', 'Skincare', 'Daily repair cream helping improve texture and barrier support.'],
  ['Sunscreen SPF 50', 'Skincare', 'Broad-spectrum SPF 50 sunscreen for daily UV protection.'],
  ['Rose Water Face Mist', 'Skincare', 'Refreshing rose face mist for instant hydration anytime.'],
  ['Clay Purifying Mask', 'Skincare', 'Purifying clay mask that helps remove excess oil and buildup.'],
  ['Matte Liquid Lipstick', 'Makeup', 'Long-wear matte lipstick with rich pigment and smooth finish.'],
  ['HD Full Coverage Foundation', 'Makeup', 'Blendable full-coverage foundation for flawless base.'],
  ['Waterproof Kajal Pencil', 'Makeup', 'Smudge-resistant kajal pencil for bold and defined eyes.'],
  ['Compact Setting Powder', 'Makeup', 'Lightweight setting powder for long-lasting oil control.'],
  ['Volume Boost Mascara', 'Makeup', 'Length and volume mascara for dramatic lash definition.'],
  ['Tinted Lip & Cheek Stick', 'Makeup', 'Multi-use tint stick for natural flush and soft glow.'],
  ['Aloe Soothing Gel', 'Body Care', 'Soothing aloe gel for calming and cooling skin comfort.'],
  ['Nourishing Body Lotion', 'Body Care', 'Deep moisturizing body lotion for silky smooth skin.'],
  ['Coffee Body Scrub', 'Body Care', 'Exfoliating coffee body scrub for polished and soft skin feel.'],
  ['Vanilla Body Mist', 'Body Care', 'Light fragrant body mist with long-lasting refreshing scent.'],
  ['Keratin Smooth Shampoo', 'Haircare', 'Keratin shampoo to smooth frizz and improve manageability.'],
  ['Argan Repair Conditioner', 'Haircare', 'Argan conditioner for nourishment and soft healthy hair.'],
  ['Anti Hair Fall Serum', 'Haircare', 'Scalp and root serum designed for stronger looking hair.'],
  ['Heat Protection Hair Spray', 'Haircare', 'Protective spray to shield hair during styling routines.'],
  ['Makeup Brush Essentials Set', 'Tools & Brushes', 'Professional brush set for full-face makeup application.'],
  ['LED Makeup Mirror', 'Tools & Brushes', 'LED-lit beauty mirror for precise makeup and skincare usage.'],
  ['Nail Care Manicure Kit', 'Tools & Brushes', 'Complete manicure kit for home nail grooming.'],
  ['Professional Hair Dryer', 'Tools & Brushes', 'Salon-style hair dryer for fast drying and smooth finish.'],
];

const curatedSareeProducts = sareeTemplates.map(([name, description], i) => {
  const price = 2399 + i * 160;
  const originalPrice = price + 1400 + (i % 3) * 200;
  return {
    name,
    description,
    image: sareeImagePool[i % sareeImagePool.length],
    price,
    originalPrice,
    discount: Math.round(((originalPrice - price) / originalPrice) * 100),
    rating: Number((4.3 + (i % 6) * 0.1).toFixed(1)),
    reviews: 70 + i * 11,
    sold: 420 + i * 23,
  };
});

const curatedBangleProducts = bangleTemplates.map(([name, description], i) => {
  const price = 899 + i * 85;
  const originalPrice = price + 900 + (i % 4) * 150;
  return {
    name,
    description,
    image: bangleImagePool[i % bangleImagePool.length],
    price,
    originalPrice,
    discount: Math.round(((originalPrice - price) / originalPrice) * 100),
    rating: Number((4.2 + (i % 7) * 0.1).toFixed(1)),
    reviews: 60 + i * 9,
    sold: 260 + i * 19,
  };
});

const curatedBeautyProducts = beautyTemplates.map(([name, subCategory, description], i) => {
  const price = 349 + i * 110;
  const originalPrice = price + 500 + (i % 5) * 120;
  return {
    name,
    subCategory,
    description,
    image: beautyImagePool[i % beautyImagePool.length],
    price,
    originalPrice,
    discount: Math.round(((originalPrice - price) / originalPrice) * 100),
    rating: Number((4.3 + (i % 6) * 0.1).toFixed(1)),
    reviews: 95 + i * 13,
    sold: 300 + i * 17,
  };
});

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
        { name: saree.name, category: 'Clothes' },
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
        { name: bangle.name, category: 'Accessories' },
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

    for (const beauty of curatedBeautyProducts) {
      await Product.updateOne(
        { name: beauty.name, category: 'Beauty' },
        {
          $set: {
            ...beauty,
            category: 'Beauty',
            subcategory: beauty.subCategory,
            images: [beauty.image],
            inStock: true,
            stock: 80,
            isTrending: true,
            isPopular: true,
            tags: ['beauty', (beauty.subCategory || '').toLowerCase(), 'premium'],
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
