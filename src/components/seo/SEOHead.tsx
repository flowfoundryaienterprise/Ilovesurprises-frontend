import { useEffect } from 'react';
import type { AppView } from '../../App';
import type { Product } from '../../types';

interface SEOHeadProps {
  view: AppView;
  product?: Product | null;
  category?: string;
  collectionHandle?: string;
  repUsername?: string | null;
  accountTab?: string;
}

const SITE_ORIGIN = 'https://ilovesurprises.com';
const BRAND_SUFFIX = '| I Love Surprises';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/logo.png`;

interface SEOResult {
  title: string;
  description: string;
  canonical: string;
  isPrivate: boolean;
  ogType: 'website' | 'product';
  ogImage: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}

function getProductSEO(product: Product): { title: string; description: string; ogImage: string } {
  const title = `${product.name} ${BRAND_SUFFIX}`;
  const scents = product.scentNotes && product.scentNotes.length > 0
    ? product.scentNotes.slice(0, 3).join(', ')
    : '';

  let description = '';
  if (product.surpriseType === 'cash') {
    description = `Shop the ${product.name}. Handcrafted soy candle featuring ${scents ? `${scents} scent notes` : 'a rich nostalgic aroma'} with real cash reveals from $2 to $2,500 sealed inside!`;
  } else if (product.surpriseType === 'jewelry') {
    description = `Discover the ${product.name}. Hand-poured soy jewelry candle featuring ${scents ? `${scents} aroma notes` : 'luxurious fragrance'} with certified fine jewelry appraised up to $5,000 inside.`;
  } else if (product.category === 'Bath & Body') {
    description = `Pamper yourself with ${product.name}. Fizzy moisturizing bath treat infused with skin-loving oils and a genuine hidden prize sealed safely inside.`;
  } else if (product.category === 'Wax Melts') {
    description = `Fill your space with ${product.name}. Highly scented artisan wax melts that slowly melt to reveal a genuine fine jewelry surprise inside!`;
  } else if (product.category === 'Soaps') {
    description = `Lather up with ${product.name}. Artisan handcrafted goat milk soap packed with nourishing oils and real surprise cash inside every bar.`;
  } else if (product.category === 'Slimes') {
    description = `Enjoy ${product.name}. Gourmet scented sensory slime packed with fun textures, sweet aromas, and a hidden prize reveal inside!`;
  } else {
    description = `Explore ${product.name}. Handcrafted with premium ingredients and a genuine surprise prize sealed safely inside. Order yours today!`;
  }

  // Ensure optimal meta description length (135–160 chars)
  if (description.length > 160) {
    description = description.slice(0, 157).trim() + '...';
  }

  const ogImage = product.image.startsWith('http')
    ? product.image
    : `${SITE_ORIGIN}${product.image}`;

  return { title, description, ogImage };
}

function getCategorySEO(category?: string): { title: string; description: string } {
  switch (category) {
    case 'Cash Candles':
      return {
        title: `Cash Money Candles ($2 to $2,500 Real Cash Inside) ${BRAND_SUFFIX}`,
        description: `Browse our viral cash money candles with genuine cash sealed safely inside every jar. Win real currency bills from $2 up to $2,500 in every hand-poured candle!`,
      };
    case 'Jewelry Candles':
      return {
        title: `Jewelry Surprise Candles — Rings, Necklaces & Earrings ${BRAND_SUFFIX}`,
        description: `Discover certified sterling silver rings, necklaces, and earrings hidden inside artisan soy candles. Every candle reveals genuine fine jewelry worth up to $5,000.`,
      };
    case 'Bath & Body':
      return {
        title: `Surprise Cash Bath Bombs & Fizzy Body Treats ${BRAND_SUFFIX}`,
        description: `Unwind with fizzy moisturizing bath bombs and body treats containing genuine cash and sparkling jewelry surprises. 100% win in every fragrant bath product!`,
      };
    case 'Wax Melts':
      return {
        title: `Figurine Scented Wax Melts with Jewelry Inside ${BRAND_SUFFIX}`,
        description: `Shop cute scented figurine wax melts that reveal gorgeous jewelry surprises as they melt. Clean-burning, long-lasting home fragrance with a guaranteed prize.`,
      };
    case 'Soaps':
      return {
        title: `Artisan Goat Milk Real Cash Soap Bars ${BRAND_SUFFIX}`,
        description: `Gentle moisturizing goat milk soap bars with real cash reveals sealed in waterproof foil inside. Win cash prizes while enjoying artisan luxury lather!`,
      };
    case 'Slimes':
      return {
        title: `Gourmet Scented Slimes with Cash & Jewelry Reveals ${BRAND_SUFFIX}`,
        description: `Sensory gourmet slimes featuring delicious scents, fun textures, and hidden jewelry charms or cash reveals. Exciting unboxing treats for all ages!`,
      };
    default:
      return {
        title: `Surprise Gift Collections by Category ${BRAND_SUFFIX}`,
        description: `Explore all surprise gift collections: Cash Candles, Jewelry Candles, Fizzy Bath Bombs, and Wax Melts. Handcrafted in the USA with certified reveals inside.`,
      };
  }
}

export function SEOHead({ view, product, category, repUsername, accountTab, collectionHandle }: SEOHeadProps) {
  useEffect(() => {
    let seo: SEOResult;

    switch (view) {
      case 'home':
        seo = {
          title: 'I Love Surprises | Handcrafted Jewelry & Real Cash Reveal Candles',
          description:
            'Experience the thrill of unboxing genuine fine jewelry and real cash reveals hidden safely inside hand-poured soy candles, bath bombs, and luxury wax treats.',
          canonical: `${SITE_ORIGIN}/`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [{ name: 'Home', url: `${SITE_ORIGIN}/` }],
        };
        break;

      case 'shop':
        seo = {
          title: `Shop All Cash & Jewelry Surprise Candles ${BRAND_SUFFIX}`,
          description:
            'Browse our full catalog of hand-poured jewelry candles, cash reveals, bath bombs, and artisan soaps. Guaranteed authentic prize inside every single order!',
          canonical: `${SITE_ORIGIN}/shop`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Shop', url: `${SITE_ORIGIN}/shop` },
          ],
        };
        break;

      case 'collection': {
        const rawHandle = collectionHandle || '';
        const cleanCol = rawHandle.replace(/^\/collections?\//, '').replace(/\/$/, '').trim().toLowerCase();
        const colPath =
          cleanCol === 'cash-candles' ||
          cleanCol === 'jewelry-candles' ||
          cleanCol === 'cash-money-candles' ||
          cleanCol === 'zodiac-cash-money-candles' ||
          cleanCol === 'funny-candle'
            ? `/candles/${cleanCol}`
            : cleanCol === 'candles'
            ? '/candles'
            : cleanCol ? `/${cleanCol}` : '/candles';
        const displayTitle = cleanCol
          ? cleanCol.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'Candles';

        seo = {
          title: `${displayTitle} ${BRAND_SUFFIX}`,
          description:
            `Explore authentic handcrafted surprise reveals in ${displayTitle} with real cash prizes ($2–$2,500) or fine jewelry inside every product.`,
          canonical: `${SITE_ORIGIN}${colPath}`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Candles', url: `${SITE_ORIGIN}/candles` },
            ...(cleanCol && cleanCol !== 'candles'
              ? [{ name: displayTitle, url: `${SITE_ORIGIN}${colPath}` }]
              : []),
          ],
        };
        break;
      }

      case 'categories': {
        const isSpecific = category && category !== 'All Surprises';
        const catSEO = getCategorySEO(isSpecific ? category : undefined);
        const catCanonical = isSpecific
          ? `${SITE_ORIGIN}/categories?category=${encodeURIComponent(category!)}`
          : `${SITE_ORIGIN}/categories`;

        const crumbs = [
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'Categories', url: `${SITE_ORIGIN}/categories` },
        ];
        if (isSpecific) {
          crumbs.push({ name: category!, url: catCanonical });
        }

        seo = {
          title: catSEO.title,
          description: catSEO.description,
          canonical: catCanonical,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: crumbs,
        };
        break;
      }

      case 'product-details': {
        if (product) {
          const prodSEO = getProductSEO(product);
          const prodCanonical = `${SITE_ORIGIN}/product/${product.slug || product.id}`;
          seo = {
            title: prodSEO.title,
            description: prodSEO.description,
            canonical: prodCanonical,
            isPrivate: false,
            ogType: 'product',
            ogImage: prodSEO.ogImage,
            breadcrumbs: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Shop', url: `${SITE_ORIGIN}/shop` },
              {
                name: product.category,
                url: `${SITE_ORIGIN}/categories?category=${encodeURIComponent(product.category)}`,
              },
              { name: product.name, url: prodCanonical },
            ],
          };
        } else {
          seo = {
            title: `Surprise Candle Product Catalog ${BRAND_SUFFIX}`,
            description:
              'Discover handcrafted jewelry candles with certified sterling silver and genuine cash reveals inside. Order clean-burning soy candles with a thrill inside!',
            canonical: `${SITE_ORIGIN}/shop`,
            isPrivate: false,
            ogType: 'website',
            ogImage: DEFAULT_IMAGE,
            breadcrumbs: [{ name: 'Shop', url: `${SITE_ORIGIN}/shop` }],
          };
        }
        break;
      }

      case 'affiliate':
        seo = {
          title: `Become an Independent Surprise Consultant ${BRAND_SUFFIX}`,
          description:
            'Start your home fragrance business for $19.99/mo. Earn 20% personal sales commission plus up to 5 tiers of team downline overrides with monthly payouts on the 15th.',
          canonical: `${SITE_ORIGIN}/affiliate`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Consultant Opportunity', url: `${SITE_ORIGIN}/affiliate` },
          ],
        };
        break;

      case 'about':
        seo = {
          title: `Our Story & Clean Candle Craftsmanship ${BRAND_SUFFIX}`,
          description:
            'Learn how I Love Surprises crafts clean-burning soy wax candles and bath treats with certified sterling silver and real currency sealed safely inside.',
          canonical: `${SITE_ORIGIN}/about`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'About Us', url: `${SITE_ORIGIN}/about` },
          ],
        };
        break;

      case 'contact':
        seo = {
          title: `Contact Customer Care & Prize Appraisal ${BRAND_SUFFIX}`,
          description:
            'Have questions about your surprise reveal, prize appraisal, or order? Contact the I Love Surprises support team for prompt, friendly customer assistance.',
          canonical: `${SITE_ORIGIN}/contact`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Contact Care', url: `${SITE_ORIGIN}/contact` },
          ],
        };
        break;

      case 'rewards':
        seo = {
          title: `Surprise Club VIP Rewards & Points Club ${BRAND_SUFFIX}`,
          description:
            'Earn Surprise Points on every candle order, referral, and review. Redeem points for exclusive discounts, free reveals, and VIP member perks.',
          canonical: `${SITE_ORIGIN}/rewards`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'VIP Rewards', url: `${SITE_ORIGIN}/rewards` },
          ],
        };
        break;

      case 'appraisal':
        seo = {
          title: `Free Jewelry Value / Appraisal ${BRAND_SUFFIX}`,
          description:
            'Found jewelry inside an eligible I Love Surprises product? Use our appraisal service to submit your jewelry information and request an estimated value or appraisal information.',
          canonical: `${SITE_ORIGIN}/appraise-your-jewelry`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Free Jewelry Value / Appraisal', url: `${SITE_ORIGIN}/appraise-your-jewelry` },
          ],
        };
        break;

      case 'checkout':
        seo = {
          title: `Secure Checkout ${BRAND_SUFFIX}`,
          description: 'Safe, 256-bit encrypted checkout for your surprise reveal candle and bath gift orders.',
          canonical: `${SITE_ORIGIN}/checkout`,
          isPrivate: true,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [],
        };
        break;

      case 'order-confirmation':
        seo = {
          title: `Order Confirmation — Thank You ${BRAND_SUFFIX}`,
          description: 'Your I Love Surprises order has been received and is being prepared with genuine surprise reveals inside.',
          canonical: `${SITE_ORIGIN}/checkout`,
          isPrivate: true,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [],
        };
        break;

      case 'account':
        seo = {
          title: `My Account & Order History ${BRAND_SUFFIX}`,
          description: 'Manage your customer profile, order tracking, addresses, and consultant back-office details.',
          canonical: `${SITE_ORIGIN}/account`,
          isPrivate: true,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [],
        };
        break;

      case 'admin':
        seo = {
          title: `Admin Control Suite ${BRAND_SUFFIX}`,
          description: 'Authorized administrative controls for catalog management, subscriptions, and commission ledgers.',
          canonical: `${SITE_ORIGIN}/admin`,
          isPrivate: true,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [],
        };
        break;

      case 'admin-login':
        seo = {
          title: `Admin Login ${BRAND_SUFFIX}`,
          description: 'Restricted administrative sign-in portal for I Love Surprises.',
          canonical: `${SITE_ORIGIN}/admin/login`,
          isPrivate: true,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [],
        };
        break;

      case 'refund-policy':
        seo = {
          title: `Refund & Return Policy ${BRAND_SUFFIX}`,
          description: 'Review the official I Love Surprises 60-day return policy and refund guidelines.',
          canonical: `${SITE_ORIGIN}/refund-policy`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Refund & Return Policy', url: `${SITE_ORIGIN}/refund-policy` },
          ],
        };
        break;

      case 'terms':
        seo = {
          title: `Terms & Conditions ${BRAND_SUFFIX}`,
          description: 'Official Terms & Conditions and store policies for ILoveSurprises.com.',
          canonical: `${SITE_ORIGIN}/terms`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Terms & Conditions', url: `${SITE_ORIGIN}/terms` },
          ],
        };
        break;

      case 'official-rules':
        seo = {
          title: `Official Rules / No Purchase Necessary ${BRAND_SUFFIX}`,
          description: 'Official promotion rules and Alternate Method of Entry (AMOE) for I Love Surprises cash reveals.',
          canonical: `${SITE_ORIGIN}/official-rules`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Official Rules', url: `${SITE_ORIGIN}/official-rules` },
          ],
        };
        break;

      case 'shipping-policy':
        seo = {
          title: `Shipping Policy ${BRAND_SUFFIX}`,
          description: 'Fast tracked shipping, handling times, delivery destinations, and carrier guidance for I Love Surprises.',
          canonical: `${SITE_ORIGIN}/shipping`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Shipping Policy', url: `${SITE_ORIGIN}/shipping` },
          ],
        };
        break;

      case 'privacy':
        seo = {
          title: `Privacy Policy ${BRAND_SUFFIX}`,
          description: 'Learn how I Love Surprises safeguards personal information, order data, and customer privacy.',
          canonical: `${SITE_ORIGIN}/privacy`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Privacy Policy', url: `${SITE_ORIGIN}/privacy` },
          ],
        };
        break;

      case 'faqs':
        seo = {
          title: `Frequently Asked Questions ${BRAND_SUFFIX}`,
          description: 'Frequently asked questions about surprise candles, jewelry, shipping, returns, and support.',
          canonical: `${SITE_ORIGIN}/faqs`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [
            { name: 'Home', url: `${SITE_ORIGIN}/` },
            { name: 'Frequently Asked Questions', url: `${SITE_ORIGIN}/faqs` },
          ],
        };
        break;

      default:
        seo = {
          title: `I Love Surprises ${BRAND_SUFFIX}`,
          description: 'Discover luxury soy candles and bath treats with real cash or fine jewelry hidden inside.',
          canonical: `${SITE_ORIGIN}/`,
          isPrivate: false,
          ogType: 'website',
          ogImage: DEFAULT_IMAGE,
          breadcrumbs: [{ name: 'Home', url: `${SITE_ORIGIN}/` }],
        };
        break;
    }

    // 1. Update Document Title
    document.title = seo.title;

    // Helper to update or create standard meta tags
    const updateOrCreateMeta = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Update Meta Description
    updateOrCreateMeta('meta[name="description"]', 'name', 'description', seo.description);

    // 3. Update Robots Directives (Strict noindex for private/checkout/account/admin pages)
    const robotsContent = seo.isPrivate
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    updateOrCreateMeta('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 4. Update Canonical Link (Ensure exactly ONE canonical tag)
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', seo.canonical);

    // 5. Update OpenGraph Tags
    updateOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    updateOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    updateOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', seo.canonical);
    updateOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', seo.ogType);
    updateOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', seo.ogImage);
    updateOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'I Love Surprises');
    updateOrCreateMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

    // 6. Update Twitter / X Card Tags
    updateOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    updateOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
    updateOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seo.ogImage);
    updateOrCreateMeta('meta[name="twitter:site"]', 'name', 'twitter:site', '@ilovesurprises');

    // 7. JSON-LD Schema.org Ingestion
    const schemas: object[] = [];

    // Organization Schema (always present)
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'I Love Surprises',
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo.png`,
      description:
        'Handcrafted soy wax candles, luxury bath bombs, and wax melts with certified fine jewelry and real cash reveals inside.',
      sameAs: [
        'https://www.facebook.com/ilovesurprises',
        'https://www.instagram.com/ilovesurprises',
        'https://www.tiktok.com/@ilovesurprises',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@ilovesurprises.com',
      },
    });

    // WebSite SearchAction Schema (on Homepage)
    if (view === 'home') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'I Love Surprises',
        url: SITE_ORIGIN,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_ORIGIN}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      });
    }

    // BreadcrumbList Schema (on public routes with breadcrumbs)
    if (!seo.isPrivate && seo.breadcrumbs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: seo.breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      });
    }

    // Product Schema (for Product Details view with real data)
    if (view === 'product-details' && product) {
      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: seo.description,
        image: seo.ogImage,
        sku: product.sku || product.id,
        brand: {
          '@type': 'Brand',
          name: 'I Love Surprises',
        },
        offers: {
          '@type': 'Offer',
          url: seo.canonical,
          priceCurrency: 'USD',
          price: product.price.toFixed(2),
          availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };

      if (product.rating) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 1,
        };
      }

      schemas.push(productSchema);
    }

    // Inject / Update JSON-LD Script Tag
    let scriptTag = document.getElementById('ils-jsonld-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'ils-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemas, null, 2);
  }, [view, product, category, repUsername, accountTab]);

  return null;
}
