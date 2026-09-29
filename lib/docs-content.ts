export interface DocSection {
  title: string;
  slug: string;
  badge?: string;
  description: string;
}

export interface DocCategory {
  title: string;
  items: DocSection[];
}

export interface DocPageContent {
  slug: string;
  title: string;
  description: string;
  badge?: string;
  category: string;
  scope: 'public' | 'dev';
  lastUpdated: string;
  tableOfContents: { id: string; title: string; level: number }[];
  content: string;
}

export const PUBLIC_DOCS_STRUCTURE: DocCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Studio Overview',
        slug: 'overview',
        badge: 'Essential',
        description: 'Introduction to Rory Skagen’s studio, Austin landmarks, and artistic heritage.'
      },
      {
        title: 'The Master Catalog',
        slug: 'catalog',
        badge: '137 Works',
        description: 'Explore the 137 cataloged fine art pieces across 4 signature series.'
      }
    ]
  },
  {
    title: 'Artwork & Quality',
    items: [
      {
        title: 'Prints, Canvas & Materials',
        slug: 'prints-and-materials',
        description: 'Archival paper specs, pigment inks, gallery canvas wrapping, and framing guides.'
      },
      {
        title: 'Collecting & Provenance',
        slug: 'collecting',
        description: 'Certificates of authenticity, studio editions, mural commissions, and licensing.'
      },
      {
        title: 'Ordering, Shipping & FAQ',
        slug: 'faq',
        description: 'Multi-currency checkout, worldwide shipping, packaging, and returns policy.'
      }
    ]
  }
];

export const DEV_DOCS_STRUCTURE: DocCategory[] = [
  {
    title: 'System & Architecture',
    items: [
      {
        title: 'Dev Overview',
        slug: 'overview',
        badge: 'v1.0',
        description: 'High-level architectural overview, tech stack, and Fourthwall storefront design.'
      },
      {
        title: 'System Architecture',
        slug: 'architecture',
        description: 'Next.js 15 App Router, data flows, ISR caching, and storefront component hierarchy.'
      },
      {
        title: 'Fourthwall API Integration',
        slug: 'fourthwall-api',
        badge: 'Core',
        description: 'Storefront API vs Platform Open API, Bearer tokens, basic auth, and webhook secrets.'
      }
    ]
  },
  {
    title: 'Data & Pipeline',
    items: [
      {
        title: 'Catalog Import Pipeline',
        slug: 'import-pipeline',
        badge: '137 Works',
        description: 'Migration from jadenblack/roryskagenart.com, Supabase DB & Cloudinary assets.'
      },
      {
        title: 'CLI & Automation Tools',
        slug: 'cli-and-scripts',
        badge: 'npm script',
        description: 'CLI commands, dry-run flags, limit parameters, and REST sync endpoints.'
      },
      {
        title: 'Environment & Security',
        slug: 'env-and-security',
        description: 'Environment variable reference, secrets management, CORS, and image remote patterns.'
      },
      {
        title: 'Build, Lint & Deployment',
        slug: 'build-and-deploy',
        badge: 'Next.js 15',
        description: 'Compilation with output: standalone, Turbopack, typecheck, tests, and CI/CD runbook.'
      }
    ]
  }
];

export const DOCS_PAGES: Record<string, DocPageContent> = {
  // Public Docs
  'public/overview': {
    slug: 'overview',
    title: 'Rory Skagen Art Studio: Master Overview',
    description: 'The creative history, vibrant mid-century pop aesthetic, and iconic Austin landmarks of artist Rory Skagen.',
    badge: 'Studio Guide',
    category: 'Getting Started',
    scope: 'public',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'about-the-artist', title: 'About Rory Skagen', level: 2 },
      { id: 'greetings-from-austin', title: 'Greetings from Austin Mural', level: 2 },
      { id: 'the-artistic-universe', title: 'The Artistic Universe', level: 2 },
      { id: 'studios-mission', title: 'The Studio’s Mission', level: 2 }
    ],
    content: `
## About Rory Skagen

Rory Skagen is an acclaimed American painter and muralist whose hyper-graphic, saturated works have shaped the visual identity of Austin, Texas for more than three decades. Blending **mid-century retro-futurism, roadside commercial Americana, giant kaiju creatures, and whimsical pop surrealism**, Skagen's canvases celebrate the golden age of American design with a modern, subversive twist.

---

## Greetings from Austin Mural

Painted in 1998 on the side of Roadside Relics on South 1st Street, the **"Greetings from Austin"** mural is one of the most recognizable and photographed public art landmarks in Texas. Modeled after vintage 1940s Curt Teich linen postcards, the mural features the Capitol dome, Congress Avenue bridge bats, and Texas longhorns framed inside 3D block lettering.

In our Fourthwall store, this iconic mural has been carefully preserved from high-resolution archival scans and reproduced as museum-grade fine art prints and gallery-wrapped canvases.

---

## The Artistic Universe

Rory Skagen’s expansive body of work is organized into four signature thematic movements:

1. **Austin Iconic & Texas Pop**: Austin landmark skyline art, vintage Texas motel signs, and roadside nostalgia.
2. **Monsters & Kaiju**: Dynamic confrontations between atomic-era giant creatures, robots, and surreal beasts (*Gianondor*, *Empopatya*, *Gaurdon*).
3. **Pop Surrealism & Folklore**: Whimsical storytelling, eccentric mid-century Americana, and surreal character portraits (*The Persistence of Cats*, *The Martian*).
4. **Atomic Pop & Sci-Fi**: Space-age exploration, rocket cruisers, retro robots, and neon ephemera.

---

## The Studio’s Mission

Through our Fourthwall partnership, the studio delivers authentic, premium-quality archival art directly to collectors worldwide, backed by secure global fulfillment and certified studio provenance.
`
  },

  'public/catalog': {
    slug: 'catalog',
    title: 'The Master Catalog: 137 Fine Art Pieces',
    description: 'Detailed overview of the 137 fine art pieces cataloged and available across all four signature collections.',
    badge: '137 Artworks',
    category: 'Getting Started',
    scope: 'public',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'catalog-breakdown', title: 'Catalog Breakdown by Series', level: 2 },
      { id: 'austin-iconic', title: 'Austin Iconic & Texas Pop (11 Works)', level: 2 },
      { id: 'monsters-kaiju', title: 'Monsters & Kaiju (34 Works)', level: 2 },
      { id: 'pop-surrealism', title: 'Pop Surrealism & Folklore (87 Works)', level: 2 },
      { id: 'atomic-sci-fi', title: 'Atomic Pop & Sci-Fi (5 Works)', level: 2 },
      { id: 'browsing-the-catalog', title: 'Browsing & Filtering Options', level: 2 }
    ],
    content: `
## Catalog Breakdown by Series

Every single artwork created in Rory Skagen's studio archive has been curated, digitized, and made available in our store with multiple size options:

| Collection / Series | Works Count | Primary Mediums | Signature Pieces |
| :--- | :--- | :--- | :--- |
| **Austin Iconic & Texas Pop** | 11 | Enamel on Steel, Acrylic | *Greetings from Austin*, *Austin Skyline 2019*, *78704* |
| **Monsters & Kaiju** | 34 | Enamel on Steel, Mixed Media | *Gianondor*, *Empopatya*, *Gaurdon*, *Gondoleu* |
| **Pop Surrealism & Folklore** | 87 | Enamel on Steel, Acrylic | *The Persistence of Cats*, *The Martian*, *Today* |
| **Atomic Pop & Sci-Fi** | 5 | Enamel, Acrylic | *Cyborg: Robots and Aliens*, Space Age Ephemera |
| **Total Archive** | **137** | **Museum Archival** | **Full Studio Breadth** |

---

## Austin Iconic & Texas Pop (11 Works)

Capturing the eccentric, warm energy of Texas culture. Highlights include:
- **Greetings from Austin** (2015 update): Archival fine art recreation of the landmark South 1st mural.
- **Austin Skyline 2019**: Vibrant neo-retro perspective of the evolving downtown skyline bathed in twilight colors.
- **Austin 78704**: Tribute to South Austin's bohemian heartland with retro typography.
- **The End of Austin**: Poignant pop-surrealist exploration of rapid urban growth.

---

## Monsters & Kaiju (34 Works)

Rory Skagen's colossal creature paintings fuse 1950s Japanese kaiju cinema with American mid-century comic book energy. Rendered originally with vibrant enamel on industrial steel plates with UV clearcoats:
- **Gianondor**: 3.5ft x 5ft enamel masterwork showcasing razor-sharp linework and hyper-saturated hues.
- **Empopatya**: Enigmatic creature with commercial advertising flair.
- **Gaurdon**: Dynamic monster portrait measuring 33" x 48".

---

## Pop Surrealism & Folklore (87 Works)

The largest thematic wing of the catalog, featuring playful homages to art history and Americana:
- **The Persistence of Cats**: Playful Dali-inspired surrealism with melting felines draped across desert structures.
- **The Martian**: Retro sci-fi character portrait radiating 1960s pulp magazine charm.
- **An Insincere Call**: Satirical commercial dialogue from mid-century office life.

---

## Atomic Pop & Sci-Fi (5 Works)

Celebrating the mid-century optimism of the Space Race, chrome automotives, and retro-futuristic robotics:
- **Cyborg: Robots and Aliens**: High-contrast, dynamic robot action with explosive cosmic palettes.

---

## Browsing & Filtering Options

Visitors can filter directly by collection from the store navigation:
- \`/USD/collections/austin-iconic\`
- \`/USD/collections/monsters-kaiju\`
- \`/USD/collections/pop-surrealism\`
- \`/USD/collections/atomic-sci-fi\`
- \`/USD/collections/all\`
`
  },

  'public/prints-and-materials': {
    slug: 'prints-and-materials',
    title: 'Prints, Canvas & Materials Guide',
    description: 'Detailed specifications for paper weights, pigment inks, canvas wraps, and care guidelines.',
    badge: 'Museum Quality',
    category: 'Artwork & Quality',
    scope: 'public',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'paper-specifications', title: 'Archival Paper Specifications', level: 2 },
      { id: 'canvas-construction', title: 'Gallery-Wrapped Canvas', level: 2 },
      { id: 'size-options', title: 'Standard Sizing Guide', level: 2 },
      { id: 'care-instructions', title: 'Care & Preservation Instructions', level: 2 }
    ],
    content: `
## Archival Paper Specifications

Every Rory Skagen fine art print is produced on museum-grade fine art stock engineered for rich color gamut and multi-generational permanence:

- **Stock Weight:** Heavyweight 230 gsm acid-free, lignin-free rag paper.
- **Surface Finish:** Smooth velvet matte coating that eliminates glare while maintaining deep black density and vivid colors.
- **Ink System:** 12-color archival pigment inkset (Giclée standard) delivering fade resistance rated for 100+ years under proper glass framing.
- **Margins:** Designed with generous white borders for easy framing and custom matting.

---

## Gallery-Wrapped Canvas

For collectors seeking a ready-to-hang gallery centerpiece without the need for framing:

- **Canvas Material:** Heavyweight 400 gsm cotton-poly blend archival canvas.
- **Stretcher Bars:** 1.5-inch deep solid pine kiln-dried stretcher bars, hand-stretched in the USA.
- **Coating:** Semi-matte protective UV coating shielding against airborne moisture, fading, and scuffs.
- **Edge Finish:** Full image mirrored or wrapped edges creating a striking 3D profile on your wall.
- **Hanging Hardware:** Pre-installed sawtooth or wire hangers with corner bumpers ready for immediate installation.

---

## Standard Sizing Guide

| Size | Print Type | Ideal Wall Placement |
| :--- | :--- | :--- |
| **12" × 18"** | Archival Fine Art Print | Home office, hallway gallery walls, intimate accent spaces |
| **18" × 24"** | Archival Fine Art Print | Bedroom, dining room, medium living room focal walls |
| **24" × 36"** | Gallery-Wrapped Canvas | Primary living room wall, office lobby, large visual statement |

---

## Care & Preservation Instructions

1. **Avoid Direct Sunlight:** Never expose unframed prints to direct, unshielded UV sunlight for extended periods.
2. **Use UV-Shielding Glass:** When framing archival paper prints, opt for UV-filtering acrylic or museum glass.
3. **Maintain Moderate Humidity:** Ideal room humidity is between 40% and 55% to prevent paper warping or canvas stretching.
4. **Cleaning:** Dust canvas gently with a dry, clean microfiber cloth. Never use water, glass cleaners, or household chemical sprays.
`
  },

  'public/collecting': {
    slug: 'collecting',
    title: 'Collecting, Provenance & Commissions',
    description: 'Authenticity guarantees, studio editions, custom mural commissions, and architectural licensing.',
    badge: 'Provenance',
    category: 'Artwork & Quality',
    scope: 'public',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'certificate-of-authenticity', title: 'Certificate of Authenticity', level: 2 },
      { id: 'studio-provenance', title: 'Studio Provenance', level: 2 },
      { id: 'mural-commissions', title: 'Public & Commercial Mural Commissions', level: 2 },
      { id: 'commercial-licensing', title: 'Commercial Licensing & Press', level: 2 }
    ],
    content: `
## Certificate of Authenticity

Every release in the Fourthwall store represents an authorized reproduction produced under direct license from the **Rory Skagen Art Studio** in Austin, Texas. Selected limited runs include a numbered studio certificate of authenticity.

---

## Studio Provenance

Rory Skagen’s original enamel-on-steel masterworks are held in prestigious private collections, corporate headquarters, and municipal installations across the United States. Purchasing through this platform guarantees that you are supporting the artist directly and receiving verified archival reproductions created from original high-resolution master captures.

---

## Public & Commercial Mural Commissions

Interested in commissioning an original mural or fine art statement piece for your hotel, corporate headquarters, brewery, or residential space?

- **Mediums:** Hand-painted exterior murals, sign-painted retro typography, enamel on steel plates, or large-format interior installations.
- **Lead Times:** Typically 6 to 12 weeks depending on site prep, scale, and travel.
- **Inquiries:** Contact our studio manager directly through the [Studio Contact Page](/pages/contact) or email **info@roryskagen.com**.

---

## Commercial Licensing & Press

For film, television, editorial, commercial packaging, or book publishing rights regarding the *Greetings from Austin* mural or Rory Skagen's iconography:

- Please submit licensing requests detailing the project scope, distribution territory, and intended duration.
- Commercial usage without an active license is strictly prohibited under international copyright law.
`
  },

  'public/faq': {
    slug: 'faq',
    title: 'Ordering, Shipping & FAQ',
    description: 'Frequently asked questions regarding international ordering, currencies, packaging, and returns.',
    badge: 'Help & FAQ',
    category: 'Artwork & Quality',
    scope: 'public',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'currencies-and-payments', title: 'Currencies & Payment Methods', level: 2 },
      { id: 'packaging-and-shipping', title: 'Packaging & Shipping Times', level: 2 },
      { id: 'order-tracking', title: 'Order Tracking & Notifications', level: 2 },
      { id: 'returns-and-replacements', title: 'Damage & Returns Policy', level: 2 }
    ],
    content: `
## Currencies & Payment Methods

Our store supports localized purchasing across five major global currencies:
- **USD ($)** — United States Dollar
- **EUR (€)** — Euro
- **GBP (£)** — British Pound
- **CAD ($)** — Canadian Dollar
- **AUD ($)** — Australian Dollar

You can toggle your preferred currency at any time using the selector in the top-right navigation bar. Checkout is powered by Fourthwall's PCI-compliant payments infrastructure, accepting all major credit cards, Apple Pay, Google Pay, and Shop Pay.

---

## Packaging & Shipping Times

All fine art pieces are made to order to avoid excess inventory and ensure pristine quality:

- **Fine Art Prints:** Printed on heavy archival paper, protected with acid-free glassine paper, and shipped inside crush-proof reinforced industrial mailing tubes.
- **Canvas Art:** Wrapped in protective bubble sheeting, secured with corner guards, and enclosed in heavy-duty corrugated shipping cartons.
- **Production Lead Time:** 3 to 5 business days for standard prints; 5 to 7 business days for stretched canvases.
- **Delivery Windows:**
  - *United States:* 3 to 5 business days after dispatch.
  - *Canada & International:* 7 to 14 business days after dispatch.

---

## Order Tracking & Notifications

Once your order has been packaged and handed off to our carrier (USPS, FedEx, or DHL Express), you will receive an automated shipping notification with a tracking number.

---

## Damage & Returns Policy

Because every piece is custom-printed to order, all sales are final. However, **your order is 100% insured against loss or damage in transit**.

If your tube or box arrives visibly damaged:
1. Photograph the exterior packaging and the damaged artwork.
2. Email **info@roryskagen.com** within 14 days of delivery.
3. Our team will immediately authorize and dispatch a brand-new replacement at zero cost to you.
`
  },

  // Developer & Build Docs (/docs/dev/*)
  'dev/overview': {
    slug: 'overview',
    title: 'Developer Overview & System Guide',
    description: 'Comprehensive technical architecture, tech stack specifications, and Fourthwall storefront implementation.',
    badge: 'Dev Guide',
    category: 'System & Architecture',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'system-mission', title: 'System Purpose & Objectives', level: 2 },
      { id: 'core-tech-stack', title: 'Core Technology Stack', level: 2 },
      { id: 'key-features', title: 'Key Features & Capabilities', level: 2 },
      { id: 'directory-structure', title: 'Repository File Map', level: 2 }
    ],
    content: `
## System Purpose & Objectives

This web application represents the production ecommerce storefront for **Rory Skagen Art**, engineered on **Next.js 15 App Router** and integrated with **Fourthwall's headless commerce APIs**.

The project fulfills two primary operational mandates:
1. **High-Performance Omnichannel Storefront:** Fast, beautifully rendered fine art catalog supporting responsive layouts, multi-currency switching (USD, EUR, GBP, CAD, AUD), and persistent cart management.
2. **Catalog Migration & Sync Engine:** Automated ingestion and synchronization pipeline that extracted 137 fine art masterworks from the legacy Supabase/Vercel codebase (\`jadenblack/roryskagenart.com\`) and mapped them into Fourthwall's Platform and Storefront data layers.

---

## Core Technology Stack

- **Framework:** Next.js 15.6 (App Router with Turbopack & ISR)
- **Runtime:** Node.js 22 LTS
- **UI & Styling:** Tailwind CSS 3.4 with container queries, clsx, and lucide-react
- **E-Commerce Layer:** Fourthwall Storefront API (v1) & Fourthwall Platform Open API (v1.0)
- **Content & Documentation:** Fumadocs Core 16.x & Fumadocs UI
- **Media Hosting:** Cloudinary CDN & Supabase Storage (public WebP renditions)
- **Quality & Testing:** TypeScript 5.5, Vitest 4.0, ESLint

---

## Key Features & Capabilities

- **137 Cataloged Artworks:** 100% of Rory Skagen's fine art catalog imported with verified high-resolution images, descriptions, dimensions, mediums, and tags.
- **Dynamic Collection Routing:** Dedicated routes for all signature series (\`austin-iconic\`, \`monsters-kaiju\`, \`pop-surrealism\`, \`atomic-sci-fi\`, \`launch\`, \`all\`).
- **Interactive Importer UI (\`/import\`):** Visual web dashboard for catalog inspection, connection testing, CSV export, and live API synchronization.
- **Fumadocs Documentation (\`/docs\` & \`/docs/dev\`):** Dual-purpose documentation engine serving customer-facing guides and developer runbooks.

---

## Repository File Map

\`\`\`
/
├── app/
│   ├── [currency]/            # Dynamic currency-scoped storefront routes
│   │   ├── page.tsx           # Home page with hero, 3-item grid & carousel
│   │   ├── collections/       # Collection filtering routes
│   │   ├── product/           # Product detail page (PDP)
│   │   └── search/            # Search & sort page
│   ├── api/
│   │   └── import/fourthwall/ # Importer REST API (GET status, POST sync, CSV)
│   ├── docs/                  # Fumadocs public documentation routes
│   │   ├── page.tsx
│   │   └── dev/               # Fumadocs developer & build documentation
│   ├── import/                # Interactive admin sync dashboard
│   ├── layout.tsx             # Root application layout
│   └── globals.css            # Tailwind & Fumadocs global styles
├── components/
│   ├── cart/                  # Cart modal, server actions, cookie storage
│   ├── docs/                  # Fumadocs navigation, sidebar & layout
│   ├── grid/                  # 3-item grid, tile components
│   └── layout/                # Storefront Navbar, Footer, Currency selector
├── lib/
│   ├── fourthwall/
│   │   ├── index.ts           # Storefront data layer, mock fallback, cart API
│   │   ├── importer.ts        # Sync engine, CSV generator, API client
│   │   ├── reshape.ts         # Normalizes Fourthwall DTOs into standard types
│   │   ├── types.ts           # TypeScript interfaces for Fourthwall schemas
│   │   └── rory-artworks-data.json # 137 fine art pieces canonical snapshot
│   ├── docs-content.ts        # Fumadocs documentation data source
│   ├── constants.ts           # Store constants & cache tags
│   └── utils.ts               # Environment variable sanitization & helpers
└── scripts/
    └── import-artworks-to-fourthwall.ts # Standalone CLI import tool
\`\`\`
`
  },

  'dev/architecture': {
    slug: 'architecture',
    title: 'System Architecture & Data Flows',
    description: 'Detailed analysis of Next.js 15 App Router architecture, ISR caching, cart management, and Fourthwall data reshaping.',
    badge: 'Architecture',
    category: 'System & Architecture',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'data-flow-diagram', title: 'End-to-End Data Flow', level: 2 },
      { id: 'server-and-client-boundary', title: 'Server vs Client Component Boundary', level: 2 },
      { id: 'caching-and-revalidation', title: 'Caching & ISR Strategy', level: 2 },
      { id: 'data-reshaping-layer', title: 'Data Reshaping Pipeline', level: 2 }
    ],
    content: `
## End-to-End Data Flow

The storefront architecture separates product retrieval, cart session storage, and administrative sync into three decoupled layers:

\`\`\`
[Visitor Browser]
       │
       ▼
[Next.js 15 App Router Server] ──► (ISR Cache: 3600s / Tag Revalidation)
       │
       ├─► Fourthwall Storefront API (https://storefront-api.fourthwall.com/v1)
       │      │  (When NEXT_PUBLIC_FW_STOREFRONT_TOKEN is active)
       │      ▼
       │   [Live Fourthwall Storefront Service]
       │
       └─► Fallback In-Memory Catalog Engine (lib/fourthwall/index.ts)
              │  (When token is placeholder or API offline)
              ▼
           [lib/fourthwall/rory-artworks-data.json]
              ├── 137 Canonical Fine Artworks
              ├── Cloudinary / Supabase Media CDN
              └── In-Memory Cart Store
\`\`\`

---

## Server vs Client Component Boundary

In accordance with Next.js 15 architectural best practices:

- **Server Components (Default):**
  - \`app/[currency]/page.tsx\`
  - \`app/[currency]/product/[handle]/page.tsx\`
  - \`components/grid/three-items.tsx\`
  - \`components/carousel.tsx\`
  - \`app/docs/[[...slug]]/page.tsx\`
  - Benefits: Zero client-side JavaScript overhead for catalog data, superior SEO, fast TTFB.

- **Client Components (\`'use client'\`):**
  - \`components/cart/modal.tsx\` (interactive cart drawer)
  - \`components/cart/add-to-cart.tsx\` (optimistic variant selection)
  - \`app/import/page.tsx\` (real-time sync dashboard with terminal output)
  - \`components/layout/navbar/currency.tsx\` (currency switching dropdown)

---

## Caching & ISR Strategy

Next.js 15 caching primitives are configured for high-traffic scalability:

\`\`\`ts
// lib/fourthwall/index.ts
export async function getCollectionProducts({ collection, currency, limit }) {
  const res = await fourthwallGet(
    \`\${API_URL}/collections/\${collection}/products\`,
    { currency, limit },
    { next: { revalidate: 3600, tags: [\`collection-\${collection}\`] } }
  );
  return reshapeProducts(res.body.results);
}
\`\`\`

- **Revalidation Window:** 3600 seconds (1 hour) background stale-while-revalidate.
- **On-Demand Cache Purging:** Server actions call \`revalidateTag(TAGS.cart, 'default')\` whenever items are added or modified in the user's cart.

---

## Data Reshaping Pipeline

Raw Fourthwall Storefront API payloads are normalized into uniform internal TypeScript models (\`lib/types.ts\`) via \`lib/fourthwall/reshape.ts\`:

\`\`\`ts
// Raw Fourthwall Product -> Reshaped Application Product
export function reshapeProduct(product: FourthwallProduct): Product {
  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    description: product.description,
    descriptionHtml: product.description,
    options: extractProductOptions(product.variants),
    variants: product.variants.map(reshapeVariant),
    images: product.images.map(reshapeImage),
    featuredImage: reshapeImage(product.images[0]),
    priceRange: calculatePriceRange(product.variants),
    tags: extractTags(product),
    updatedAt: product.updatedAt
  };
}
\`\`\`
`
  },

  'dev/fourthwall-api': {
    slug: 'fourthwall-api',
    title: 'Fourthwall API Integration Reference',
    description: 'Technical reference for Fourthwall Storefront API, Platform Open API, authentication schemes, and webhooks.',
    badge: 'API Specs',
    category: 'System & Architecture',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'api-overview', title: 'The Dual API Model', level: 2 },
      { id: 'storefront-api', title: 'Storefront API (v1)', level: 2 },
      { id: 'platform-open-api', title: 'Platform Open API (v1.0)', level: 2 },
      { id: 'authentication-methods', title: 'Authentication Methods', level: 2 },
      { id: 'cart-and-checkout-lifecycle', title: 'Cart & Checkout Lifecycle', level: 2 }
    ],
    content: `
## The Dual API Model

Fourthwall provides two distinct API tiers designed for separate operational roles:

| API Tier | Base Endpoint | Primary Purpose | Required Credentials |
| :--- | :--- | :--- | :--- |
| **Storefront API** | \`https://storefront-api.fourthwall.com/v1\` | Public catalog browsing, product query, cart creation, checkout generation | \`NEXT_PUBLIC_FW_STOREFRONT_TOKEN\` |
| **Platform Open API** | \`https://api.fourthwall.com/open-api/v1.0\` | Administrative backend product creation, media library upload, catalog ingestion | \`FOURTHWALL_ACCESS_TOKEN\` or Basic Auth |

---

## Storefront API (v1)

Used directly by the storefront client to query data:

### Endpoints Used in Storefront:
- \`GET /collections\`: Fetches all published collections.
- \`GET /collections/{handle}/products\`: Returns products in a collection filtered by currency.
- \`GET /products/{handle}\`: Returns a single product with full variant tree.
- \`POST /carts\`: Initializes a new persistent cart session.
- \`GET /carts/{id}\`: Retrieves an existing cart by ID.
- \`POST /carts/{id}/add\`: Adds merchandise items to an existing cart.
- \`POST /carts/{id}/change\`: Updates item quantities or variants.
- \`POST /carts/{id}/remove\`: Removes line items.
- \`GET /shop\`: Returns shop metadata and public checkout domains.

---

## Platform Open API (v1.0)

Used by \`lib/fourthwall/importer.ts\` and \`scripts/import-artworks-to-fourthwall.ts\` for syncing catalog artworks to the Fourthwall merchant backend:

### Product Creation Payload Contract:
\`\`\`json
{
  "name": "Greetings from Austin",
  "slug": "greetings-from-austin",
  "description": "Original fine artwork Greetings from Austin by Rory Skagen...",
  "type": "physical",
  "status": "ACTIVE",
  "tags": ["greetings-from-austin", "mural", "texas", "Austin Iconic & Texas Pop", "Enamel"],
  "images": [
    {
      "url": "https://res.cloudinary.com/xjilp2pq/image/upload/v1787076996/GreetingsfromAustin.jpg",
      "width": 2100,
      "height": 1400,
      "alt": "Greetings from Austin by Rory Skagen - Enamel"
    }
  ],
  "variants": [
    {
      "name": "12\" x 18\" Archival Print",
      "sku": "RS-GREETING-1",
      "price": 55.00,
      "currency": "USD",
      "inventoryType": "UNLIMITED",
      "attributes": { "size": "12\" x 18\"", "medium": "Enamel" }
    }
  ]
}
\`\`\`

---

## Authentication Methods

Our integration supports three distinct authentication schemes depending on your configuration:

1. **Bearer Token (Recommended for Service Accounts):**
   \`\`\`http
   Authorization: Bearer <FOURTHWALL_ACCESS_TOKEN>
   \`\`\`
2. **Basic Authentication (API Key + Secret):**
   \`\`\`http
   Authorization: Basic base64(<FOURTHWALL_API_KEY>:<FOURTHWALL_API_SECRET>)
   \`\`\`
3. **Storefront Header:**
   \`\`\`http
   X-Storefront-Token: <NEXT_PUBLIC_FW_STOREFRONT_TOKEN>
   \`\`\`

---

## Cart & Checkout Lifecycle

Cart sessions are stored in an encrypted HTTP-only cookie keyed to the storefront token:
\`\`\`ts
// components/cart/actions.ts
const tokenHash = cleanEnv(process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN) || 'default';
const cookieStore = await cookies();
cookieStore.set(\`\${tokenHash}/cartId\`, cartId);
\`\`\`

When a customer clicks **Proceed to Checkout**, they are redirected to Fourthwall's hosted, secure checkout domain (\`NEXT_PUBLIC_FW_CHECKOUT\` or \`shop.roryskagen.com\`).
`
  },

  'dev/import-pipeline': {
    slug: 'import-pipeline',
    title: 'Catalog Import Pipeline & Data Migration',
    description: 'Technical breakdown of extracting 137 fine art pieces from jadenblack/roryskagenart.com into Fourthwall.',
    badge: 'Data Pipeline',
    category: 'Data & Pipeline',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'source-system-analysis', title: 'Source System Analysis', level: 2 },
      { id: 'extraction-and-normalization', title: 'Extraction & Normalization', level: 2 },
      { id: 'media-asset-resolution', title: 'Media Asset Resolution', level: 2 },
      { id: 'canonical-json-schema', title: 'Canonical JSON Schema', level: 2 }
    ],
    content: `
## Source System Analysis

The source artwork catalog was located in the repository **\`https://github.com/jadenblack/roryskagenart.com\`**, a Next.js / Express web application using a **Supabase PostgreSQL database** and a media asset pipeline distributed across **Cloudinary** and **Supabase Storage**.

Key source files identified and parsed:
- \`data/archive/portfolioPostsData.updated.json\`: 137 raw catalog entries containing titles, dates, mediums, dimensions, and Cloudinary URLs.
- \`supabase/migrations/2026_09_13_cms_v2_source_of_truth_backfill.sql\`: Full narrative descriptions and historical notes for each artwork.
- \`src/data/assetRegistry.ts\`: 1MB asset registry containing optimized WebP rendition links hosted on Supabase public buckets.

---

## Extraction & Normalization

We executed an automated ingestion script that merged the structured metadata from \`portfolioPostsData.updated.json\` with the rich narrative text extracted from the SQL backfill migration.

### Transformation Rules Applied:
1. **Title & Slugs:** Canonical database slugs preserved (e.g. \`greetings-from-austin\`, \`gianondor\`, \`austin-2019\`).
2. **Series Classification:** Mapped each item's series into store collection handles:
   - *Monsters & Kaiju* → \`monsters-kaiju\`
   - *Austin Iconic & Texas Pop* → \`austin-iconic\`
   - *Pop Surrealism & Folklore* → \`pop-surrealism\`
   - *Atomic Pop & Sci-Fi* → \`atomic-sci-fi\`
   - All pieces also belong to \`all\`.
3. **Launch Selection:** 13 flagship pieces (including the Austin mural, Skyline, Godzilla, and giant Kaiju) were assigned to the \`launch\` collection to power the homepage hero and carousel.
4. **Description Formatting:** Stripped markdown frontmatter and obsidian wiki-links (\`[[...]]\`) to generate clean, customer-facing product descriptions.
5. **Pricing Matrix:** Computed tier-based pricing based on original artwork dimensions:
   - Standard pieces: $45 USD base.
   - Large-scale / mural works (e.g. 3.5ft × 5ft): $55 USD base.

---

## Media Asset Resolution

Each artwork's primary image was validated for availability. Both Cloudinary and Supabase media hosts respond with HTTP 200:
- Cloudinary: \`https://res.cloudinary.com/xjilp2pq/image/upload/...\`
- Supabase: \`https://orphcusijzkxpxkzapjp.supabase.co/storage/v1/object/public/artwork-images/...\`

Both hosts have been configured in \`next.config.js\` under \`images.remotePatterns\` to permit Next.js image optimization.

---

## Canonical JSON Schema

The resulting artifact is stored in **\`lib/fourthwall/rory-artworks-data.json\`**. Structure of each entry:

\`\`\`ts
interface RoryArtworkData {
  id: string;             // e.g. "rory-gianondor"
  slug: string;           // e.g. "gianondor"
  title: string;          // e.g. "Gianondor"
  year: string;           // e.g. "2019"
  date: string;           // e.g. "2019-07-12"
  medium: string;         // e.g. "Enamel"
  dimensions: string;     // e.g. "3.5ft x 5ft"
  status: string;         // e.g. "Available" | "Sold"
  series: string;         // e.g. "Monsters & Kaiju"
  tags: string[];         // e.g. ["enamel", "kaiju", "monster", "2019"]
  description: string;    // Clean descriptive text
  narrative: string;      // Full markdown narrative
  collections: string[];  // ["all", "monsters-kaiju", "launch"]
  basePriceUSD: number;   // 55
  image: {
    url: string;
    transformedUrl: string;
    width: number;
    height: number;
    altText: string;
  };
  variantOptions: {
    name: string;
    size: string;
    priceMultiplier: number;
  }[];
}
\`\`\`
`
  },

  'dev/cli-and-scripts': {
    slug: 'cli-and-scripts',
    title: 'CLI & Automation Tools',
    description: 'Documentation for running CLI import scripts, dry-run flags, limit filters, and REST endpoints.',
    badge: 'Automation',
    category: 'Data & Pipeline',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'npm-import-script', title: 'Running the CLI Tool', level: 2 },
      { id: 'cli-options', title: 'CLI Options & Flags', level: 2 },
      { id: 'rest-api-endpoints', title: 'REST API Endpoints', level: 2 },
      { id: 'csv-and-json-exports', title: 'CSV & Open API Exports', level: 2 }
    ],
    content: `
## Running the CLI Tool

We created a dedicated CLI runner located in \`scripts/import-artworks-to-fourthwall.ts\`. You can execute it directly via npm:

\`\`\`bash
# Run dry-run validation (no API writes)
npm run import:fourthwall -- --dry-run

# Run full live sync with active Fourthwall credentials
npm run import:fourthwall

# Process a small test batch (e.g. 5 artworks)
npm run import:fourthwall -- --limit=5
\`\`\`

---

## CLI Options & Flags

| Flag | Type | Description |
| :--- | :--- | :--- |
| \`--dry-run\` | Boolean | Runs full payload generation and schema validation without making network writes to Fourthwall. |
| \`--limit=<n>\` | Number | Restricts the sync run to the first \`<n>\` items (useful for testing single items or rate limits). |
| \`--slug=<slug>\` | String | Syncs a specific single artwork by slug (e.g. \`--slug=greetings-from-austin\`). |

---

## REST API Endpoints

The web application exposes a dedicated internal API route at **\`/api/import/fourthwall\`**:

### 1. Catalog Status & Health Check
\`\`\`http
GET /api/import/fourthwall
\`\`\`
**Response:**
\`\`\`json
{
  "status": "ready",
  "summary": {
    "totalArtworks": 137,
    "seriesBreakdown": {
      "Austin Iconic & Texas Pop": 11,
      "Monsters & Kaiju": 34,
      "Pop Surrealism & Folklore": 87,
      "Atomic Pop & Sci-Fi": 5
    },
    "credentialsStatus": {
      "apiUrl": "https://storefront-api.fourthwall.com",
      "hasStorefrontToken": true,
      "hasPlatformCredentials": false
    }
  }
}
\`\`\`

### 2. Triggering Sync via HTTP
\`\`\`http
POST /api/import/fourthwall
Content-Type: application/json

{
  "dryRun": true,
  "limit": 10
}
\`\`\`

---

## CSV & Open API Exports

For merchants who prefer importing via Fourthwall's dashboard or third-party bulk tools:

- **Download Fourthwall Product CSV:**
  \`\`\`http
  GET /api/import/fourthwall?format=csv
  \`\`\`
  Generates a standard CSV with handles, titles, HTML descriptions, option sizes, prices, and high-res image sources.

- **Download Open API JSON:**
  \`\`\`http
  GET /api/import/fourthwall?format=fourthwall-json
  \`\`\`
  Returns a pre-formatted JSON array ready for direct ingestion via Fourthwall's Platform API batch endpoints.
`
  },

  'dev/env-and-security': {
    slug: 'env-and-security',
    title: 'Environment Variables & Security',
    description: 'Reference guide for required environment variables, secret tokens, CORS, and remote image patterns.',
    badge: 'Security',
    category: 'Data & Pipeline',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'environment-variables', title: 'Environment Variables Reference', level: 2 },
      { id: 'sanitization-and-cleaning', title: 'Environment Variable Sanitization', level: 2 },
      { id: 'image-domains', title: 'Next.js Remote Image Whitelisting', level: 2 },
      { id: 'security-best-practices', title: 'Secrets Security Best Practices', level: 2 }
    ],
    content: `
## Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| \`NEXT_PUBLIC_FW_API_URL\` | Client & Server | Yes | Base URL for Fourthwall Storefront API (\`https://storefront-api.fourthwall.com/v1\`). |
| \`NEXT_PUBLIC_FW_STOREFRONT_TOKEN\` | Client & Server | Yes | Storefront token provided in your Fourthwall dashboard developer settings. |
| \`NEXT_PUBLIC_FW_COLLECTION\` | Client & Server | No | Default collection for the homepage grid and carousel (defaults to \`launch\` or \`all\`). |
| \`NEXT_PUBLIC_FW_CHECKOUT\` | Client & Server | No | Custom domain or fallback checkout domain (\`https://shop.roryskagen.com\`). |
| \`FOURTHWALL_ACCESS_TOKEN\` | Server Only | Optional | Bearer access token for Fourthwall Platform API write operations. |
| \`FOURTHWALL_API_KEY\` | Server Only | Optional | Basic auth API Key / Username for Fourthwall Platform API. |
| \`FOURTHWALL_API_SECRET\` | Server Only | Optional | Basic auth API Secret / Password for Fourthwall Platform API. |
| \`FOURTHWALL_WEBHOOK_SECRET\` | Server Only | Optional | Secret key to verify incoming Fourthwall webhook event signatures. |

---

## Environment Variable Sanitization

Environment variables imported from external tools often include surrounding quotes or inline comments (e.g. \`"value" # comment\`). To prevent parsing failures, all environment variables pass through \`cleanEnv()\` in \`lib/utils.ts\`:

\`\`\`ts
// lib/utils.ts
export function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  let cleaned = value.trim();
  if (cleaned.includes(' #')) {
    cleaned = cleaned.split(' #')[0]!.trim();
  }
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}
\`\`\`

---

## Next.js Remote Image Whitelisting

Next.js strict Image Optimization blocks remote image URLs unless explicitly registered in \`next.config.js\`. The following domains are whitelisted:

\`\`\`js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.fourthwall.com' },
      { protocol: 'https', hostname: '*.fourthwall.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
};
\`\`\`

---

## Secrets Security Best Practices

1. **Never prefix private keys with \`NEXT_PUBLIC_\`**: Only public storefront tokens and API URLs should carry the \`NEXT_PUBLIC_\` prefix.
2. **Platform write credentials must remain server-side**: \`FOURTHWALL_ACCESS_TOKEN\` and \`FOURTHWALL_API_SECRET\` are strictly consumed in server-side API routes (\`app/api/import/fourthwall/route.ts\`) and CLI scripts.
`
  },

  'dev/build-and-deploy': {
    slug: 'build-and-deploy',
    title: 'Build, Lint & Deployment Runbook',
    description: 'Step-by-step build lifecycle, TypeScript verification, linting, and production deployment instructions.',
    badge: 'Operations',
    category: 'Data & Pipeline',
    scope: 'dev',
    lastUpdated: 'September 2026',
    tableOfContents: [
      { id: 'compilation-and-build', title: 'Compilation & Build Pipeline', level: 2 },
      { id: 'lint-and-typecheck', title: 'Linting & Static Analysis', level: 2 },
      { id: 'testing-with-vitest', title: 'Running Test Suites', level: 2 },
      { id: 'production-deployment', title: 'Production Deployment Guide', level: 2 }
    ],
    content: `
## Compilation & Build Pipeline

The project compiles with Next.js 15 App Router and standalone output mode:

\`\`\`bash
# Production optimized build
npm run build
\`\`\`

- **Standalone Output:** Configured with \`output: 'standalone'\` in \`next.config.js\`. This creates a lightweight self-contained server bundle in \`.next/standalone\` optimized for Docker containers, Google Cloud Run, and Kubernetes.
- **Turbopack Compiler:** Next.js 15 uses Turbopack for near-instant hot module replacement and build compilation.

---

## Linting & Static Analysis

Linting is enforced with TypeScript typechecking in \`package.json\`:

\`\`\`bash
# Run TypeScript static analysis
npm run lint
\`\`\`

Runs \`tsc --noEmit\` against the entire project tree, verifying route types, prop interfaces, and Fourthwall DTO contracts.

---

## Running Test Suites

Vitest is configured for unit and integration testing:

\`\`\`bash
# Run test suite once
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

---

## Production Deployment Guide

### Option A: Vercel (Native)
1. Push codebase to GitHub or connect repository.
2. Vercel automatically detects Next.js 15 and configures Edge Middleware and Serverless Functions.
3. Define required environment variables in the Vercel Project Settings:
   - \`NEXT_PUBLIC_FW_API_URL\`
   - \`NEXT_PUBLIC_FW_STOREFRONT_TOKEN\`
   - \`NEXT_PUBLIC_FW_CHECKOUT\`

### Option B: Docker / Container Platforms (Cloud Run / AWS ECS)
1. The \`output: 'standalone'\` build creates \`.next/standalone/server.js\`.
2. Package with Node.js 22 LTS container.
3. Expose port 3000 (\`PORT=3000\`).
4. Execute \`node .next/standalone/server.js\`.
`
  }
};

export function getDocPage(scope: 'public' | 'dev', slug: string): DocPageContent | null {
  const key = `${scope}/${slug}`;
  return DOCS_PAGES[key] || null;
}
