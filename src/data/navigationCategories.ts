export interface SubCategoryItem {
  id: string;
  name: string;
  slug: string;
  badge?: string;
  description?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface NavCategoryColumn {
  heading: string;
  items: SubCategoryItem[];
}

export interface NavSpotlightCard {
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  priceStart?: string;
  ctaText: string;
  targetCategory: string;
  targetQuery?: string;
}

export interface NavigationCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  isDirectLink?: boolean;
  badge?: string;
  hideInDesktopNav?: boolean;
  columns?: NavCategoryColumn[];
  spotlight?: NavSpotlightCard;
  viewAllLabel?: string;
  viewAllCategory?: string;
}

export const NAVIGATION_CATEGORIES: NavigationCategory[] = [
  {
    id: 'home',
    name: 'Home',
    slug: 'home',
    href: '/',
    isDirectLink: true,
  },
  {
    id: 'candles',
    name: 'Candles',
    slug: 'candles',
    href: '/collections/candles',
    badge: 'POPULAR',
    columns: [
      {
        heading: 'Cash & Novelty Candles',
        items: [
          { id: 'cash-money-candles', name: 'Cash Money Candles', slug: 'cash-money-candles', badge: '💵 Up to $2,500', isPopular: true },
          { id: 'cash-candles', name: 'Cash Candles', slug: 'cash-candles', badge: '💵 Real Cash', isPopular: true },
          { id: 'jewelry-candles', name: 'Jewelry Candles', slug: 'jewelry-candles', badge: '💎 Real Jewelry', isPopular: true },
          { id: 'funny-cash-candles', name: 'Funny Cash Candles', slug: 'funny-candle' },
          { id: 'military-cash-candles', name: 'Military Cash Candles', slug: 'military-cash-candles' },
          { id: 'soda-pop-cash-candles', name: 'Soda Pop Cash Candles', slug: 'soda-pop-candles-soda-candles-soda-cash-candles-soda-money-candles' },
        ],
      },
      {
        heading: 'Cereal & Foodie Editions',
        items: [
          { id: 'cereal-bowl-candles', name: 'Cereal Bowl Candles', slug: 'cereal-bowl-candles-cereal-candles', isPopular: true },
          { id: 'cereal-cash-candles', name: 'Cereal Cash Candles', slug: 'cereal-candles-cereal-cash-candles' },
          { id: 'jewelry-cereal-candles', name: 'Jewelry Cereal Candles', slug: 'jewelry-cereal-candles' },
          { id: 'coffee-mug-cash-candles', name: 'Coffee Mug Cash Candles', slug: 'cash-coffee-candles-coffee-mug-candles' },
          { id: 'foodie-cash-candles', name: 'Foodie Cash Candles', slug: 'foodie-jewelry-candles-jewelry-candles-for-foodies' },
          { id: 'wine-bottle-cash-candles', name: 'Wine Bottle Cash Candles', slug: 'wine-bottle-cash-candles' },
        ],
      },
      {
        heading: 'Zodiac, Astrology & Anime',
        items: [
          { id: 'zodiac-cash-candles', name: 'Zodiac Cash Candles', slug: 'zodiac-cash-money-candles', badge: '✨ Cosmic' },
          { id: 'astrology-birthdate-cash-candles', name: 'Astrology BirthDATE Cash Candles', slug: 'astrology-birthdate-cash-candles' },
          { id: 'anime-cash-candles', name: 'Anime Cash Candles', slug: 'cash-anime-candles', badge: '🔥 Trending' },
        ],
      },
    ],
    spotlight: {
      title: 'Diamond Jewelry & Cash Candles',
      subtitle: 'Real diamonds, 14k gold, or up to $2,500 cash in every candle.',
      image: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
      badge: '★ Best Seller',
      priceStart: '$28.99',
      ctaText: 'Shop All Candles',
      targetCategory: 'Jewelry Candles',
    },
    viewAllLabel: 'View All Candles',
    viewAllCategory: 'Candles',
  },
  {
    id: 'wax-melts',
    name: 'Wax Melts',
    slug: 'wax-melts',
    href: '/collections/wax-melts',
    columns: [
      {
        heading: 'Cash & Surprise Melts',
        items: [
          { id: 'cereal-bowl-wax-melts-cash', name: 'Cereal Bowl Wax Melts (Cash Inside)', slug: 'cereal-bowl-wax-melts', badge: '💵 Cash Inside', isPopular: true },
          { id: 'giant-cash-mega-melts', name: 'Giant Cash Mega Melts', slug: 'cash-wax-melts' },
          { id: 'cash-wax-melts', name: 'Cash Wax Melts', slug: 'cash-wax-melt' },
          { id: 'happy-birthday-cash-wax-melts', name: 'Happy Birthday Cash Wax Melts', slug: 'happy-birthday-cash-wax-melts' },
          { id: 'wax-melt-bundles', name: 'Wax Melt Bundles', slug: 'cash-wax-melt-surprise-bundles', badge: 'Save 25%' },
          { id: 'surprise-bears', name: 'Surprise Bears', slug: 'cash-surprise-bear-and-cash-wax-melt-bundles' },
        ],
      },
      {
        heading: 'Jewelry Wax Melts',
        items: [
          { id: 'cereal-bowl-wax-melts-jewelry', name: 'Cereal Bowl Wax Melts (Jewelry Inside)', slug: 'cereal-bowl-jewelry-wax-melts', badge: '💎 Jewelry' },
          { id: 'jewelry-wax-melts', name: 'Jewelry Wax Melts', slug: 'jewelry-wax-melts' },
          { id: 'giant-jewelry-mega-melts', name: 'Giant Jewelry Mega Melts', slug: 'giant-jewelry-wax-melts' },
        ],
      },
    ],
    spotlight: {
      title: 'Figurine Scented Melts',
      subtitle: 'Cute hand-poured aroma shapes with sparkling surprises revealed.',
      image: '/assets/ilovesurprises/categories/Cat-2_Figurines_JWL_wax_melts.jpg',
      badge: '✨ Artisan Crafted',
      priceStart: '$14.99',
      ctaText: 'Shop Wax Melts',
      targetCategory: 'Wax Melts',
    },
    viewAllLabel: 'View All Wax Melts',
    viewAllCategory: 'Wax Melts',
  },
  {
    id: 'bath-bombs',
    name: 'Bath + Bombs',
    slug: 'bath-bombs',
    href: '/collections/bath-bombs',
    columns: [
      {
        heading: 'Bath Bombs & Bundles',
        items: [
          { id: 'cash-bath-bombs', name: 'Cash Bath Bombs', slug: 'cash-bath-bombs', badge: '💵 Cash Inside', isPopular: true },
          { id: 'surprise-rose-bear-bundle', name: 'Surprise Rose Bear / Cash Bath Bomb Bundle', slug: 'rose-cash-surprise-bear-jumbo-cash-bath-bomb-collection', badge: '🎁 Gift Set' },
          { id: 'astrology-cash-bath-bombs', name: 'Astrology Cash Bath Bombs', slug: 'astrology-cash-bath-bombs' },
          { id: 'cash-bath-bomb-tube-bundles', name: 'Cash Bath Bomb Tube Bundles', slug: 'cash-bath-bombs-bundles' },
          { id: 'jewelry-bath-bombs', name: 'Jewelry Bath Bombs', slug: 'jewelry-bath-bombs', badge: '💎 Jewelry' },
        ],
      },
      {
        heading: 'Body Scrubs & Soaks',
        items: [
          { id: 'cash-sugar-scrubs', name: 'Cash Sugar Scrubs', slug: 'sugar-scrubs' },
          { id: 'jewelry-sugar-scrubs', name: 'Jewelry Sugar Scrubs', slug: 'jewelry-sugar-scrubs-1' },
          { id: 'cash-bath-soaks', name: 'Cash Bath Soaks', slug: 'money-bath-salts' },
        ],
      },
    ],
    spotlight: {
      title: 'Luxury Fizzy Bath Rituals',
      subtitle: 'Skin-softening essential oils with floating waterproof reveals.',
      image: '/assets/ilovesurprises/categories/Heartfelt-Hugs.jpg',
      badge: '🌸 Spa Luxury',
      priceStart: '$16.99',
      ctaText: 'Shop Bath & Body',
      targetCategory: 'Bath & Body',
    },
    viewAllLabel: 'View All Bath + Bombs',
    viewAllCategory: 'Bath & Body',
  },
  {
    id: 'soaps',
    name: 'Soaps',
    slug: 'soap',
    href: '/collections/soap',
    columns: [
      {
        heading: 'Handmade Artisan Soaps',
        items: [
          { id: 'goat-milk-cash-money-soaps', name: 'Goat Milk Cash Money Soaps', slug: 'goat-milk-soaps', badge: '💵 Cash Inside', isPopular: true },
          { id: 'cash-mystery-bars', name: 'Cash Mystery Soap Bars', slug: 'money-soaps' },
          { id: 'artisan-herbal-soaps', name: 'Artisan Herbal Soaps', slug: 'soap' },
          { id: 'soap-bundles-gift-sets', name: 'Soap Bundles & Gift Sets', slug: 'soap' },
        ],
      },
    ],
    spotlight: {
      title: 'Goat Milk Cash Money Soaps',
      subtitle: 'Real dollar bills sealed inside rich, velvety botanical soap bars.',
      image: '/assets/ilovesurprises/categories/goats_milk_soaps.jpg',
      badge: '🌿 100% Organic',
      priceStart: '$9.99',
      ctaText: 'Shop Soaps',
      targetCategory: 'Soaps',
    },
    viewAllLabel: 'View All Soaps',
    viewAllCategory: 'Soaps',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    slug: 'jewelry',
    href: '/collections/jewelry',
    badge: 'REAL GEMS',
    columns: [
      {
        heading: 'Jewelry Collections',
        items: [
          { id: 'mystery-rings', name: 'Mystery Rings', slug: 'ring-candles', badge: '💎 Diamonds', isPopular: true },
          { id: 'necklaces-pendants', name: 'Necklaces & Pendants', slug: 'necklace-candles' },
          { id: 'bracelets-bangles', name: 'Bracelets & Bangles', slug: 'bracelet-candles' },
          { id: 'earrings', name: 'Earrings & Studs', slug: 'earring-candles' },
        ],
      },
      {
        heading: 'Surprise Reveals',
        items: [
          { id: 'cash-jewelry', name: 'Cash Jewelry', slug: 'cash-jewelry', badge: '💵 Win Cash' },
          { id: 'zodiac-birthstone-jewelry', name: 'Zodiac & Birthstone Jewelry', slug: 'zodiac-candles' },
          { id: 'mens-jewelry', name: 'Men’s Jewelry', slug: 'mens-jewelry' },
          { id: 'jewelry-surprise-mystery-boxes', name: 'Jewelry Surprise Mystery Boxes', slug: 'jewelry-surprise-mystery-boxes', badge: '🎁 8 Curated' },
        ],
      },
    ],
    spotlight: {
      title: 'Fine Jewelry Collections',
      subtitle: 'Solid 925 sterling silver, 14k gold, and certified genuine gemstones.',
      image: '/assets/ilovesurprises/hero/hero-lifestyle-reveal.jpg',
      badge: '💎 Up to $7,500',
      priceStart: '$34.99',
      ctaText: 'Explore Jewelry',
      targetCategory: 'Jewelry Candles',
      targetQuery: 'Jewelry',
    },
    viewAllLabel: 'View All Jewelry',
    viewAllCategory: 'Jewelry Candles',
  },
  {
    id: 'candy',
    name: 'Candy',
    slug: 'candy',
    href: '/collections/candy',
    columns: [
      {
        heading: 'Sweet Surprise Candy',
        items: [
          { id: 'cash-candy', name: 'Cash Candy', slug: 'cash-candy', badge: '💵 Real Cash', isPopular: true },
          { id: 'jewelry-candy', name: 'Jewelry Candy', slug: 'jewelry-candy', badge: '💎 Real Jewelry' },
          { id: 'gummy-surprise-pouches', name: 'Gummy Surprise Pouches', slug: 'gummy-surprise-pouches' },
          { id: 'sweet-treat-bundles', name: 'Sweet Treat Bundles', slug: 'sweet-treat-bundles' },
        ],
      },
    ],
    spotlight: {
      title: 'Gourmet Surprise Candy',
      subtitle: 'Delicious artisan gummies and candies featuring cash & jewelry reveals.',
      image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
      badge: '🍬 Sweet Reveals',
      priceStart: '$12.99',
      ctaText: 'Shop Candy',
      targetCategory: 'Candy',
    },
    viewAllLabel: 'View All Candy',
    viewAllCategory: 'Candy',
  },
  {
    id: 'chocolates',
    name: 'Chocolates',
    slug: 'chocolates',
    href: '/collections/chocolates',
    columns: [
      {
        heading: 'Gourmet Chocolates',
        items: [
          { id: 'cash-chocolates', name: 'Cash Chocolates', slug: 'cash-chocolates', badge: '💵 Cash Inside', isPopular: true },
          { id: 'jewelry-chocolate', name: 'Jewelry Chocolate', slug: 'jewelry-chocolates', badge: '💎 Real Jewelry' },
          { id: 'gourmet-chocolate-bars', name: 'Gourmet Chocolate Bars', slug: 'city-cash-chocolates' },
          { id: 'luxury-reveal-gift-boxes', name: 'Luxury Reveal Gift Boxes', slug: 'luxury-reveal-gift-boxes', badge: 'Gift Ready' },
        ],
      },
    ],
    spotlight: {
      title: 'Belgian Chocolate Reveals',
      subtitle: 'Decadent handcrafted chocolates concealing real cash or fine jewelry.',
      image: '/assets/ilovesurprises/categories/BDayCake.webp',
      badge: '🍫 Pure Cocoa',
      priceStart: '$15.99',
      ctaText: 'Shop Chocolates',
      targetCategory: 'Chocolates',
    },
    viewAllLabel: 'View All Chocolates',
    viewAllCategory: 'Chocolates',
  },
  {
    id: 'slimes',
    name: 'Slimes',
    slug: 'slimes',
    href: '/collections/slimes',
    columns: [
      {
        heading: 'Sensory Gourmet Slimes',
        items: [
          { id: 'cash-slimes', name: 'Cash Slimes', slug: 'cash-slimes', badge: '💵 Real Cash', isPopular: true },
          { id: 'cash-cereal-slimes', name: 'Cash Cereal Slimes', slug: 'cash-cereal-slimes', isPopular: true },
          { id: 'jewelry-cereal-slimes', name: 'Jewelry Cereal Slimes', slug: 'jewelry-cereal-slimes' },
          { id: 'astrology-cash-slimes', name: 'Astrology Cash Slimes', slug: 'astrology-cash-slimes' },
          { id: 'jewelry-slimes', name: 'Jewelry Slimes', slug: 'jewelry-slimes', badge: '💎 Jewelry' },
        ],
      },
    ],
    spotlight: {
      title: 'Scented Gourmet Slimes',
      subtitle: 'Glossy, cloud, and butter slimes with hidden charms, cash, and jewels.',
      image: '/assets/ilovesurprises/categories/BDayCake.webp',
      badge: '🎉 Viral Sensation',
      priceStart: '$12.99',
      ctaText: 'Shop Slimes',
      targetCategory: 'Slimes',
    },
    viewAllLabel: 'View All Slimes',
    viewAllCategory: 'Slimes',
  },
  {
    id: 'cards',
    name: 'Cards',
    slug: 'greeting-cards',
    href: '/collections/greeting-cards',
    columns: [
      {
        heading: 'Surprise Greeting Cards',
        items: [
          { id: 'funny-cash-greeting-cards', name: 'Funny Cash Greeting Cards', slug: 'funny-cash-greeting-cards', badge: '💵 Real Cash', isPopular: true },
          { id: 'jewelry-greeting-cards', name: 'Jewelry Greeting Cards', slug: 'jewelry-greeting-cards-1', badge: '💎 Jewelry' },
        ],
      },
    ],
    spotlight: {
      title: 'Surprise Greeting Cards',
      subtitle: 'Humorous, heartwarming cards with a sealed envelope reveal inside.',
      image: '/assets/ilovesurprises/banners/mjb.png',
      badge: '💌 Pop & Reveal',
      priceStart: '$8.99',
      ctaText: 'Shop Cards',
      targetCategory: 'Cards',
    },
    viewAllLabel: 'View All Cards',
    viewAllCategory: 'Cards',
  },
  {
    id: 'affiliate',
    name: 'Affiliate Program',
    slug: 'affiliate',
    href: '/affiliate',
    isDirectLink: true,
  },
  {
    id: 'appraisal',
    name: 'Appraise Jewelry',
    slug: 'appraise-your-jewelry',
    href: '/appraise-your-jewelry',
    isDirectLink: true,
    badge: '💎 Value',
  },
  {
    id: 'contact',
    name: 'Contact',
    slug: 'contact',
    href: '/contact',
    isDirectLink: true,
    hideInDesktopNav: true,
  },
];

export function getCleanCollectionUrl(handle: string): string {
  if (!handle) return '/collections';
  const clean = handle
    .replace(/^\/collections?\//i, '')
    .replace(/^\/candles\//i, '')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .trim()
    .toLowerCase();
  return clean ? `/collections/${clean}` : '/collections';
}
