/**
 * Centralized Store Policies & Threshold Constants
 * Authoritative single-source-of-truth across ILoveSurprises frontend.
 */

// Free shipping nationwide threshold in USD
export const FREE_SHIPPING_THRESHOLD = 50;

// Standard shipping fee when below threshold
export const STANDARD_SHIPPING_FEE = 5.99;

// Official customer return window in days (matches RefundPolicy.tsx)
export const RETURN_POLICY_DAYS = 60;

// Marketing guarantee display (e.g. "60-Day Returns" or "30-Day Returns")
export const RETURN_POLICY_LABEL = `${RETURN_POLICY_DAYS}-Day Returns`;

// Representative monthly membership subscription fee in USD
export const REP_MONTHLY_MEMBERSHIP_FEE = 19.99;
export const REP_MONTHLY_MEMBERSHIP_LABEL = `$${REP_MONTHLY_MEMBERSHIP_FEE.toFixed(2)}/month`;
export const REP_MONTHLY_MEMBERSHIP_SHORT_LABEL = `$${REP_MONTHLY_MEMBERSHIP_FEE.toFixed(2)}/mo`;

// Official customer support contact
export const SUPPORT_EMAIL = 'support@ilovesurprises.com';

// Official Social Media Channels (verified from SEOHead)
export const OFFICIAL_SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/ilovesurprises',
  instagram: 'https://www.instagram.com/ilovesurprises',
  tiktok: 'https://www.tiktok.com/@ilovesurprises',
  // Twitter / X handle unconfirmed in metadata; base domain used
  twitter: 'https://twitter.com',
};
