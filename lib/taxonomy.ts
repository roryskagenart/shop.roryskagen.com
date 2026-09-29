/**
 * Rory Skagen Art — Universal Taxonomy & Merchandising Hierarchy
 * 
 * CORE INGREDIENT: Rory's Iconic Artwork
 * COMMERCIAL ENGINE: Monetizing Rory's cultural fame, Austin's global rise,
 * affluent tech & creative population, corporate/organization events,
 * B2B/HR gifting, and Gift DTC.
 */

export interface ProductCollectionDefinition {
  handle: string;
  title: string;
  shortTitle: string;
  badge?: string;
  status: 'active' | 'inquiry' | 'roadmap';
  priceRange: string;
  description: string;
  heroTagline: string;
  targetAudience: string[];
  productTypes: string[];
  sampleProducts: string[];
  b2bEligible: boolean;
  minOrderQuantity?: number;
}

export interface BuyerPersona {
  id: string;
  title: string;
  category: 'B2B' | 'DTC' | 'Collector';
  description: string;
  idealCollections: string[];
  volumeTier: string;
}

export interface ArtSeriesTaxonomy {
  id: string;
  name: string;
  culturalAnchor: string;
  piecesCount: number;
}

export const ART_SERIES_TAXONOMY: ArtSeriesTaxonomy[] = [
  {
    id: 'austin-iconic',
    name: 'Austin Iconic & Texas Pop',
    culturalAnchor: 'World-famous murals (Greetings from Austin), skyline evolutions, and Texas roadside pop culture.',
    piecesCount: 11
  },
  {
    id: 'monsters-kaiju',
    name: 'Monsters & Kaiju',
    culturalAnchor: 'Colossal atomic creatures, retro-futuristic monster battles, and dynamic comic-scale enamel masterworks.',
    piecesCount: 34
  },
  {
    id: 'pop-surrealism',
    name: 'Pop Surrealism & Folklore',
    culturalAnchor: 'Playful mid-century Americana satire, eccentric feline surrealism, and retro diner narratives.',
    piecesCount: 87
  },
  {
    id: 'atomic-sci-fi',
    name: 'Atomic Pop & Sci-Fi',
    culturalAnchor: 'Space-race optimism, chrome robots, extraterrestrial visitors, and neon cybernetic futurism.',
    piecesCount: 5
  }
];

export const BUYER_PERSONAS: BuyerPersona[] = [
  {
    id: 'hr-corporate-onboarding',
    title: 'Tech & Corporate HR / People Ops',
    category: 'B2B',
    description: 'Companies welcoming executive hires and remote workers to Austin with distinctive local cultural gifts.',
    idealCollections: ['b2b-corporate-gifts', 'desk-art', 'kitsch-cpg'],
    volumeTier: '25 – 500 units'
  },
  {
    id: 'event-planners-vip',
    title: 'Event, Festival & VIP Hospitality Planners',
    category: 'B2B',
    description: 'Curators for SXSW speaker gifts, ACL VIP lounges, Formula 1 hospitality suites, and corporate summits.',
    idealCollections: ['b2b-corporate-gifts', 'metal-litho', 'kitsch-cpg', 'fine-art-originals'],
    volumeTier: '10 – 250 units'
  },
  {
    id: 'commercial-architects',
    title: 'Hospitality, Hotel & Commercial Interior Designers',
    category: 'B2B',
    description: 'Designers procuring landmark visual centerpieces for boutique hotels, tech lobbies, and restaurant spaces.',
    idealCollections: ['fine-art-originals', 'metal-litho', 'canvas-prints'],
    volumeTier: '1 – 15 statement pieces'
  },
  {
    id: 'affluent-collectors',
    title: 'Affluent Collectors & Fine Art Patrons',
    category: 'Collector',
    description: 'Private collectors acquiring verified 1-of-1 enamel-on-steel masterworks with certified provenance.',
    idealCollections: ['fine-art-originals'],
    volumeTier: '1-of-1 Originals'
  },
  {
    id: 'gift-dtc-enthusiasts',
    title: 'Austin Locals, Tourists & Gift DTC',
    category: 'DTC',
    description: 'Enthusiasts seeking authentic Austin gifts, wearable tees, diner mugs, and limited prints.',
    idealCollections: ['kitsch-cpg', 'apparel', 'desk-art', 'canvas-prints'],
    volumeTier: '1 – 5 units'
  }
];

export const PRODUCT_COLLECTIONS: ProductCollectionDefinition[] = [
  {
    handle: 'fine-art-originals',
    title: 'Fine Art Originals ($4,000 – $28,000)',
    shortTitle: 'Original Masterworks',
    badge: 'Premier Active Collection',
    status: 'active',
    priceRange: '$4,000 – $28,000',
    heroTagline: '1-of-1 Museum Enamel-on-Steel & Acrylic Masterpieces by Rory Skagen',
    targetAudience: ['Affluent Private Collectors', 'Tech Founders & Executives', 'Corporate Headquarters', 'Boutique Hotels'],
    productTypes: ['Original Enamel on Heavy Steel', 'Acrylic & Enamel on Steel Plate', 'Monumental Mural Studies'],
    sampleProducts: [
      'Greetings from Austin (Original Master Study, 3.5ft x 5ft) — $28,000',
      'Austin Skyline 2019 (Original Masterwork, 3.5ft x 5ft) — $24,000',
      'Greetings from Texas (Original Master Study, 3.5ft x 5ft) — $19,500',
      'Gianondor (Original Kaiju Masterwork, 3.5ft x 5ft) — $18,500',
      'Empopatya (Original Kaiju Masterwork, 3.5ft x 5ft) — $16,000',
      'The Persistence of Cats (Original, 33in x 4ft) — $14,500'
    ],
    b2bEligible: true,
    description: 'The crown jewels of the studio: fifteen authentic 1-of-1 monumental original artworks executed on industrial steel plates with automotive UV clearcoats. Each original includes a hand-signed Certificate of Authenticity, direct studio provenance, and custom wooden freight crate delivery.'
  },
  {
    handle: 'b2b-corporate-gifts',
    title: 'B2B, HR & Corporate Gifting',
    shortTitle: 'B2B & VIP Gifting',
    badge: 'Corporate / HR',
    status: 'inquiry',
    priceRange: '$65 – $750 / kit',
    heroTagline: 'Curated Austin Welcome Kits, Executive VIP Gifts & Event Planner Suites',
    targetAudience: ['Corporate HR Departments', 'Executive Event Planners', 'SXSW & ACL VIP Curators', 'Tech Relocation Teams'],
    productTypes: ['The Austin Welcome Box', 'Executive Desk Gift Set', 'VIP Speaker Token Package', 'Custom Co-Branded Prints'],
    sampleProducts: [
      'The "Greetings from Austin" Executive Welcome Box (Desk Litho, Diner Mug, Leather Coaster)',
      'Austin Skyline Corporate Appreciation Gift Set (Aluminum Print + Signed Certificate)',
      'SXSW / F1 VIP Speaker Gift Box in Custom Pine Wooden Box'
    ],
    b2bEligible: true,
    minOrderQuantity: 10,
    description: 'Turnkey corporate gifting designed for Austin’s thriving corporate and event ecosystem. Perfect for tech onboarding, board of directors appreciation, client milestone celebrations, and high-profile conference attendees.'
  },
  {
    handle: 'metal-litho',
    title: 'Metal Lithos & Enamel Steel Prints',
    shortTitle: 'Metal Lithos',
    badge: 'Industrial Pop',
    status: 'roadmap',
    priceRange: '$125 – $450',
    heroTagline: 'Heavyweight Aluminum & Industrial Steel Plate Multiples',
    targetAudience: ['Modern Offices', 'Loft Apartments', 'Architectural Spaces', 'High-End DTC'],
    productTypes: ['Brushed Aluminum Metal Prints', 'Gloss Chromaluxe Panels', 'Laser-Cut Steel Silhouettes'],
    sampleProducts: [
      'Austin Skyline Brushed Metal Lithograph (16" x 24")',
      'Gianondor Gloss Steel Wall Panel (20" x 30")',
      'The Martian Atomic Metal Silhouette (12" x 18")'
    ],
    b2bEligible: true,
    description: 'Capturing the metallic industrial sheen of Rory’s original steel paintings. Printed with dye-sublimation on aircraft-grade aluminum and industrial steel panels with float-mount wall cleats.'
  },
  {
    handle: 'canvas-prints',
    title: 'Museum Canvas & Archival Prints',
    shortTitle: 'Canvas & Archival',
    badge: 'Museum Quality',
    status: 'active',
    priceRange: '$45 – $380',
    heroTagline: 'Archival Giclée Fine Art Stock & Gallery-Wrapped Stretched Canvas',
    targetAudience: ['Art Collectors', 'Home Decorators', 'Interior Designers', 'Gallery Patrons'],
    productTypes: ['400gsm Gallery Canvas Wraps', '230gsm Velvet Matte Rag Prints', 'Framed Gallery Editions'],
    sampleProducts: [
      'Greetings from Austin (24" x 36" Gallery Canvas Wrap)',
      'Austin Skyline 2019 (18" x 24" Archival Matte Print)',
      'The Persistence of Cats (12" x 18" Fine Art Giclée)'
    ],
    b2bEligible: true,
    description: 'Museum-quality reproductions crafted with 12-color archival pigment inks guaranteed for 100+ years of vivid color permanence. Hand-stretched in the USA on 1.5-inch kiln-dried pine bars.'
  },
  {
    handle: 'desk-art',
    title: 'Desk Art & Executive Objects',
    shortTitle: 'Desk Art',
    badge: 'Executive',
    status: 'roadmap',
    priceRange: '$35 – $95',
    heroTagline: 'Optical Acrylic Blocks, Desktop Steel Minis & Stone Coasters',
    targetAudience: ['Tech Workers', 'Office Desks', 'Executive Suites', 'B2B Welcome Kits'],
    productTypes: ['1-Inch Thick Optical Acrylic Blocks', 'Desktop Metal Easel Art', 'Absorbent Sandstone Coaster Sets'],
    sampleProducts: [
      'Greetings from Austin 6"x8" Free-Standing Lucite Block',
      'Atomic Kaiju Desk Silhouette on Walnut Base',
      'Austin Landmark 4-Piece Sandstone Coaster Set with Cork Backing'
    ],
    b2bEligible: true,
    minOrderQuantity: 15,
    description: 'Compact cultural statement pieces engineered for executive workspaces, conference rooms, and credenzas. Heavyweight, shatter-proof acrylic blocks and architectural desk accessories.'
  },
  {
    handle: 'kitsch-cpg',
    title: 'Kitsch, CPG & Austin Pop Living',
    shortTitle: 'Kitsch & CPG',
    badge: 'Everyday Pop',
    status: 'roadmap',
    priceRange: '$14 – $42',
    heroTagline: 'Heavy Diner Mugs, Barware, Enamel Pins, Motel Keys & Die-Cut Stickers',
    targetAudience: ['Austin Enthusiasts', 'Tourists', 'DTC Gift Buyers', 'Swag Kits'],
    productTypes: ['15oz Ceramic Retro Diner Coffee Mugs', 'Hard Enamel Collector Pins', 'Heavyweight Barware Rocks Glasses', 'UV Vinyl Sticker Packs'],
    sampleProducts: [
      'Greetings from Austin Heavy Ceramic Diner Mug (15oz)',
      'Gianondor Kaiju Glow-in-the-Dark Hard Enamel Pin',
      'Retro Austin Motel Key Tag (Green / Gold Embossed)',
      'Rory Skagen 6-Pack Die-Cut Weatherproof Vinyl Stickers'
    ],
    b2bEligible: true,
    minOrderQuantity: 25,
    description: 'High-margin, collectible Americana kitsch celebrating Austin’s funky retro roots. Everyday utility objects infused with Rory Skagen’s unmistakable color palette.'
  },
  {
    handle: 'apparel',
    title: 'Studio Wear & Graphic Tees',
    shortTitle: 'Studio Apparel',
    badge: 'Wearable Art',
    status: 'roadmap',
    priceRange: '$34 – $88',
    heroTagline: 'Heavyweight Vintage-Wash Cotton Tees, Atomic Hoodies & Trucker Caps',
    targetAudience: ['Streetwear Fans', 'Pop Art Lovers', 'Festival Attendees', 'Locals'],
    productTypes: ['6.5oz Heavyweight Garment-Dyed Graphic Tees', '450gsm French Terry Pullover Hoodies', 'Structured Retro Foam Trucker Caps'],
    sampleProducts: [
      'Greetings from Austin Vintage Wash Heavyweight Tee (Pepper / Vintage White)',
      'Austin Skyline 2019 Atomic Robot Hoodie (Washed Black)',
      'Roadside Relics Retro Embroidered Trucker Hat'
    ],
    b2bEligible: true,
    description: 'Premium wearable canvas pieces produced on 100% carded heavyweight cotton with water-based discharge inks for a soft, authentic vintage hand feel.'
  }
];

export function getCollectionByHandle(handle: string): ProductCollectionDefinition | undefined {
  return PRODUCT_COLLECTIONS.find((c) => c.handle === handle);
}
