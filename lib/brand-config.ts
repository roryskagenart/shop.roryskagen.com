/**
 * Rory Skagen Art - Brand Configuration & Feature Flags
 * Propagation across roryskagenart.com -> roryskagenart.fourthwall.com -> shop.roryskagenart.com
 */

import { cleanEnv } from './utils';

export const BRAND_CONFIG = {
  name: 'Rory Skagen Art',
  tagline: 'Austin, Texas • Est. 1985',
  legalName: 'Rory Skagen Art Studio LLC',
  originCity: 'Austin, Texas',
  estYear: 1985,

  domains: {
    portfolio: 'https://roryskagenart.com',
    fourthwallHosted: 'https://roryskagenart.fourthwall.com',
    shopCustomDomain: 'https://shop.roryskagenart.com'
  },

  assets: {
    icon192: '/android-chrome-192x192.png',
    appleTouchIcon: '/apple-touch-icon.png',
    favicon32: '/favicon-32x32.png',
    favicon16: '/favicon-16x16.png',
    manifest: '/site.webmanifest'
  },

  theme: {
    galleryStoneLight: {
      background: '#e3e1da',
      card: '#eeede8',
      foreground: '#1c1c20',
      border: '#d2cfc6',
      lineStrong: '#3a3a40'
    },
    charcoalGalleryDark: {
      background: '#17171b',
      card: '#1d1d22',
      foreground: '#f0f0f2',
      border: '#33333a',
      lineStrong: '#52525c'
    }
  },

  /**
   * Feature Flags
   * Step 1: brandExperienceV1 - Basic low-risk congruent brand visuals, official icon, and logo propagation
   */
  features: {
    brandExperienceV1: cleanEnv(process.env.NEXT_PUBLIC_FEATURE_BRAND_V1) !== 'false',
    
    /**
     * Step 2: Planned future release feature flags (disabled in Step 1 scope)
     */
    crossDomainSso: false,
    omnichannelGlobalHeader: false,
    realtimePaletteSync: false,
    arRoomPreview: false,
    commissionInquiryModal: false
  },

  /**
   * Future Releases Roadmap (Step 2 Planning Specification)
   */
  roadmap: [
    {
      phase: 'Step 1 (Current Release - Low Risk / Active)',
      version: 'v1.1.0',
      status: 'active',
      scope: 'Brand logo, icon, core visuals, Shadcn/TW tokens, and favicon propagation across all storefront routes with feature flag isolation.'
    },
    {
      phase: 'Step 2 - Release A (Future)',
      version: 'v1.2.0',
      status: 'planned',
      title: 'Unified Omnichannel Header & Cart Sync',
      scope: 'Shared header component synchronized across roryskagenart.com and shop.roryskagenart.com via cross-domain session cookies.'
    },
    {
      phase: 'Step 2 - Release B (Future)',
      version: 'v1.3.0',
      status: 'planned',
      title: 'Cross-Domain Studio Accounts (SSO)',
      scope: 'Single sign-on uniting Fourthwall supporter checkout accounts with roryskagenart.com collector memberships.'
    },
    {
      phase: 'Step 2 - Release C (Future)',
      version: 'v1.4.0',
      status: 'planned',
      title: 'Automated Palette & Design System Sync',
      scope: 'Webhook listener that receives theme/palette switches made in the roryskagenart.com studio admin and updates storefront theme tokens.'
    },
    {
      phase: 'Step 2 - Release D (Future)',
      version: 'v1.5.0',
      status: 'planned',
      title: 'AR Wall Visualizer & In-Situ Previews',
      scope: 'Augmented reality mobile camera preview allowing collectors to project 1:1 scale fine art pieces on their home walls before purchasing.'
    }
  ]
};
