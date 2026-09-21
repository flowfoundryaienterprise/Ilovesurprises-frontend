# I Love Surprises

A high-performance luxury e-commerce platform for handcrafted soy candles, wax melts, and bath products featuring genuine hidden cash and fine jewelry reveals. The application includes a customer-facing storefront, an interactive jewelry appraisal system, a 5-tier consultant/affiliate portal with downline genealogy tracking, and a multi-role administrative back-office console.

---

## Overview

**I Love Surprises** delivers an interactive direct-to-consumer (DTC) and direct-selling shopping experience centered on reveal-style luxury goods. Customers purchase scented soy candles, wax figurines, bath bombs, and soaps containing enclosed capsules with real cash prizes ($2 to $2,500) or genuine fine jewelry (valued between $10 and $7,500).

The application solves three key operational objectives:
1. **Consumer Retail Experience**: Rich catalog navigation, surprise-type filtering, custom variant selection (ring sizes 5–11), interactive map-based checkout, and self-service jewelry appraisal lookup.
2. **Consultant & Affiliate Network**: A multi-level direct-selling model featuring 5-tier commission calculations, personal sales qualification tracking ($125/month threshold), visual genealogy downline trees, and lifetime customer attribution.
3. **Store Administration**: A role-gated back office providing inventory management, order processing, refund issuance, commission ledger audits, and homepage CMS configuration.

---

## Key Features

### Storefront & Consumer Experience
* **Dynamic Product Catalog**: Multi-faceted filtering across categories, reveal types (Cash, Jewelry, Trinket, Charm, Mystery), ring sizes, scent notes, price ranges, and stock status.
* **Interactive Product Details**: High-resolution gallery view, real-time inventory indicators, ring size selectors, surprise value indicators, and verified customer reviews.
* **Slide-Out Cart Drawer**: Live subtotal computation, free-shipping threshold tracker, item quantity adjustments, and custom surprise specification badges.
* **Multi-Step Checkout**: Contact and shipping entry with an interactive Leaflet/OpenStreetMap modal location picker and reverse geocoding.
* **Order Confirmation & Tracking**: Post-checkout receipt generation with simulated tracking numbers (`9400...`), order summaries, and delivery estimates.
* **Customer Account Management**: Order history tracking, saved shipping addresses, wishlist curation, and localized currency/regional display settings.

### Jewelry Appraisal Verification
* **Secret Code Lookup (`/appraise`)**: Enables customers to input the unique certificate code found inside jewelry capsules to inspect appraised retail value, material specifications, gem cuts, and serial authentication numbers.
* **Customer Appraisal Request Form**: Integrated submission workflow for custom or unlisted jewelry evaluations.

### Consultant & Affiliate Platform (`/affiliate`)
* **5-Tier Commission Structure**: Automated commission calculation spanning Personal Sales (20%), Tier 1 (5%), Tier 2 (4%), Tier 3 (3%), Tier 4 (2%), and Tier 5 (1%).
* **Monthly Qualification Tracker**: Real-time progress monitoring toward the mandatory $125/month retail customer sales requirement to unlock downline commissions (personal purchases are excluded).
* **Interactive Genealogy Tree**: Hierarchical visualization of downline representatives with sales volumes, active ranks, and member counts.
* **Performance Analytics**: Time-series charts visualizing commission earnings, conversion rates, and referral volume.
* **Lifetime Customer Attribution**: Permanent representative-to-customer binding ensuring consultants receive commission on subsequent customer purchases.
* **Payouts Management**: Fund withdrawal request workflow supporting PayPal, Direct Bank Transfer, Venmo, and Check.
* **Marketing Kit**: Access to branded promotional banners and custom referral link generators.

### Multi-Role Administration (`/admin`)
* **Role-Based Access Control (RBAC)**: Support for Super Admin, Store Manager, Affiliate Director, Support Agent, and Auditor profiles with granular tab visibility.
* **Commerce Operations**: Order fulfillment status tracking, refund processing, and promotional discount code management.
* **Catalog Controls**: Product and collection creation, inventory adjustments, and price overrides.
* **Commission Ledger**: Review, approve, or reject pending consultant commissions and process withdrawal requests.
* **Representative Directory**: Consultant directory with status auditing and suspension toggles.
* **Appraisal Ledger**: Administrative repository for managing authorized appraisal codes and valuations.

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (`19.2.8`) | Core UI library utilizing modern hooks and concurrent rendering |
| **Language** | TypeScript (`~6.0.2`) | Strict type definitions across models, services, and components |
| **Build Tool & Dev Server** | Vite 8 (`8.2.2`) | Fast ESM bundler with hot module replacement (HMR) |
| **Styling** | Tailwind CSS v4 (`4.3.3`) | Utility-first styling via `@tailwindcss/vite` and design tokens |
| **Animation** | Framer Motion (`13.1.1`) | UI micro-interactions, modal transitions, and route animations |
| **Icons** | Lucide React (`1.37.0`) | Modern icon set used throughout storefront and dashboards |
| **Mapping & Geocoding** | Leaflet (`1.9.4`) | Interactive map picker with OpenStreetMap Nominatim reverse geocoding |
| **Routing** | Custom Browser Router | Lightweight native HTML5 History API router with `React.lazy` code splitting |
| **State & Persistence** | Client Service Layer | Persistent browser `localStorage` registries for auth, orders, and catalogs |
| **Code Quality** | Oxlint (`1.79.0`) | High-performance Rust-based JavaScript and TypeScript linter |

---

## Project Architecture

```text
ilovesurprises-platform/
├── public/                         # Static web assets
│   ├── assets/ilovesurprises/      # Image libraries (products, hero banners, categories)
│   ├── favicon.svg                 # Application favicon
│   ├── logo.png                    # Brand identity asset
│   ├── robots.txt                  # Search engine crawler directives
│   └── sitemap.xml                 # XML sitemap
├── src/                            # Application source code
│   ├── components/                 # Reusable UI & domain-specific components
│   │   ├── account/                # Account overview, addresses, wishlist, order history
│   │   ├── admin/                  # Administrative management tabs, tables, and forms
│   │   ├── affiliate/              # Consultant dashboard, genealogy tree, charts, payouts
│   │   ├── auth/                   # Authentication modals, login, and registration forms
│   │   ├── cart/                   # Slide-out cart drawer with item calculation
│   │   ├── checkout/               # Multi-step checkout form, Leaflet map picker modal
│   │   ├── home/                   # Hero section, category spotlights, customer reviews
│   │   ├── layout/                 # Main navigation header, footer, representative banner
│   │   ├── products/               # Product cards, catalog grid, and filter sidebar
│   │   ├── seo/                    # Dynamic document head and metadata tags
│   │   └── ui/                     # Primitives (modals, skeletons, toast notifications)
│   ├── constants/                  # Currency, regional, and business configuration
│   ├── data/                       # Static catalogs, navigation schemas, and geo data
│   ├── hooks/                      # Custom React hooks (usePathname history router)
│   ├── pages/                      # Top-level view components
│   ├── services/                   # Business logic, state services, and data access
│   ├── types/                      # TypeScript interfaces and domain models
│   ├── utils/                      # Helper utilities (image fallbacks, search ranking)
│   ├── App.tsx                     # Primary router and application state orchestration
│   ├── index.css                   # Global CSS, design tokens, and Tailwind v4 directives
│   └── main.tsx                    # Application entry point
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusion rules
├── .oxlintrc.json                  # Oxlint configuration
├── index.html                      # Entry HTML document with Google Fonts & OpenGraph meta
├── package.json                    # Dependencies, metadata, and lifecycle scripts
├── tsconfig.app.json               # Application-specific TypeScript compiler options
├── tsconfig.json                   # Root TypeScript project reference
├── tsconfig.node.json              # Node tooling TypeScript compiler options
└── vite.config.ts                  # Vite 8 configuration with React and Tailwind plugins
```

---

## Application Flow

### 1. Customer Shopping Flow
```
Home / Catalog Browser
  │
  ├── Product Filtering & Search (Category, Scent, Ring Size, Price)
  │
  └── Product Details Page
        ├── Select Surprise Option (Cash vs. Jewelry & Ring Size)
        └── Add to Cart Drawer
              │
              └── Multi-Step Checkout
                    ├── Shipping Details & Interactive Map Geocoding
                    ├── Delivery Tier Selection
                    ├── Payment Simulation (Card, Digital Wallets, COD)
                    └── Order Confirmation & US Tracking ID Generation
```

### 2. Representative Attribution & Commission Flow
```
Visitor arrives via Consultant URL (/rep/:username or ?rep=:username)
  │
  ├── Attribution Service checks Consultant status (active vs. suspended)
  ├── Lifetime Attribution Registry binds customer to Consultant
  │
  └── Customer completes an order
        ├── Order recorded in persistent ledger
        ├── Commission Service calculates 5-tier distribution
        │     ├── Personal Sale: 20%
        │     └── Downline Levels 1–5: 5%, 4%, 3%, 2%, 1%
        └── Monthly Qualification Service updates $125 threshold progress
```

### 3. Administrative Control Flow
```
Staff Navigation to /admin/login
  │
  ├── Role selection & credential verification
  │
  └── Admin Console (/admin)
        ├── Dynamic tab authorization based on assigned role
        ├── Catalog & Inventory Management
        ├── Order Fulfillment & Refund Management
        ├── Commission Ledger Approvals & Payout Processing
        └── Jewelry Appraisal Certificate Registry
```

---

## Pages and Modules

| Page / Route | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `Home.tsx` | Landing page featuring hero banners, category carousels, featured reveals, and customer reviews |
| `/shop` | `Shop.tsx` | Searchable and filterable master product catalog |
| `/product/:slug` | `ProductDetails.tsx` | Detailed product specifications, scent notes, variant selectors, and reviews |
| `/collection/:handle` | `Collection.tsx` | Targeted collection landing page (e.g., Cash Candles, Jewelry Candles, Wax Melts) |
| `/categories` | `Categories.tsx` | Visual index of all available product categories and item counts |
| `/checkout` | `Checkout.tsx` | Multi-step checkout with address validation, Leaflet map location picker, and payment methods |
| `/order-confirmation/:id` | `OrderConfirmation.tsx` | Post-purchase receipt with generated tracking numbers and order breakdown |
| `/account` | `Account.tsx` | Customer profile, address book, order history, and regional preferences |
| `/affiliate` | `AffiliateDashboard.tsx` | Consultant portal with earnings metrics, genealogy tree, qualification progress, and payouts |
| `/admin` | `AdminDashboard.tsx` | Administrative suite for orders, products, commissions, staff permissions, and CMS settings |
| `/admin/login` | `AdminLogin.tsx` | Staff authentication portal with role presets |
| `/appraise` | `AppraiseJewelry.tsx` | Public jewelry appraisal code verification tool and evaluation request form |
| `/rewards` | `Rewards.tsx` | Customer loyalty program overview, points structure, and redemption tiers |
| `/about` | `About.tsx` | Brand background, artisan hand-pouring process, and product craftsmanship |
| `/contact` | `Contact.tsx` | Customer support contact form and corporate communication channels |
| `/faqs` | `FAQ.tsx` | Frequently asked questions regarding orders, candle care, reveals, and shipping |
| `/refund-policy` | `RefundPolicy.tsx` | Official return and refund policy documentation |
| `/shipping-policy` | `ShippingPolicy.tsx` | Domestic and international delivery terms, transit times, and rates |
| `/terms` | `Terms.tsx` | Terms of service and legal conditions |
| `/privacy` | `PrivacyPolicy.tsx` | Privacy policy and data handling documentation |
| `/official-rules` | `OfficialRules.tsx` | Regulatory disclosures and terms governing cash and jewelry surprise reveals |

---

## Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ilovesurprises-platform
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Initialize local environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

---

## Environment Variables

The application is structured as a client-side architecture with browser-backed persistence and requires no mandatory environment variables to run locally.

The `.env.example` file is provided as a baseline for future backend integrations:

```env
# I Love Surprises - Frontend Standalone Environment Configuration
# Standalone frontend environment configuration.
# Add any future frontend-specific environment variables here.
```

> **Note**: Do not commit private keys, credentials, or production tokens into version control.

---

## Available Scripts

The following scripts are defined in `package.json`:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript declarations (`tsc -b`) and bundles production assets via Vite. |
| `npm run lint` | Runs Oxlint across the project for fast static code analysis and linting. |
| `npm run preview` | Serves the production build locally from the `dist/` directory for validation. |

---

## Development Guidelines

* **Component Structure**: Place domain-specific UI components in their respective subdirectory under `src/components/<domain>/`. Generic UI elements belong in `src/components/ui/`.
* **TypeScript Types**: Define shared domain interfaces in `src/types/`. Avoid inline or untyped objects for data structures like orders, products, and user profiles.
* **Design System**: Use the predefined color and spacing tokens established in `src/index.css` alongside Tailwind CSS v4 classes to maintain visual consistency.
* **Code Quality**: Ensure the project compiles cleanly and passes static analysis by running `npm run lint` and `npm run build` prior to committing.

---

## Deployment

The application compiles into an optimized, static single-page application (SPA) output located in the `dist/` directory.

### Production Build
```bash
npm run build
```

### Static Hosting Configuration
This build can be hosted on any modern static web platform (such as Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront, or GitHub Pages). 

Ensure your hosting provider or web server is configured with a Single-Page Application (SPA) rewrite rule directing all route requests to `/index.html`:

```nginx
# Example Nginx SPA Rewrite
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Project Status

* **Completed & Implemented**:
  * Complete consumer storefront with full catalog filtering and search
  * Custom variant selection (ring sizes 5–11, cash vs. jewelry options)
  * Interactive slide-out cart drawer and persistent cart items
  * Leaflet map location picker modal with OpenStreetMap reverse geocoding
  * Multi-step checkout with simulated payment providers
  * Order confirmation and tracking ID generation
  * Public jewelry appraisal secret code verification tool
  * 5-tier affiliate compensation system with monthly qualification tracking
  * Interactive affiliate genealogy tree and earnings visualization
  * Multi-role administrative dashboard with inventory, order, and commission controls
  * Customer account portal with address management and localized currency settings
* **Backend Readiness**:
  * Service layer abstractions (`orderService`, `productService`, `customerAuthService`, `commissionService`, `adminService`) are isolated and ready for REST/GraphQL API integration.

---

## Contributing

1. Fork or branch from the main repository.
2. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Implement your changes following existing code conventions.
4. Verify typing and linting:
   ```bash
   npm run lint
   npm run build
   ```
5. Commit your changes with concise, imperative commit messages:
   ```bash
   git commit -m "feat: implement feature description"
   ```
6. Push to your branch and open a pull request.

---

## License

This project is marked as private and proprietary (`"private": true` in `package.json`). All rights reserved.
