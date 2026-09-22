/**
 * Representative & Consultant Attribution Service
 * Manages active consultant attribution across products, collections, cart, and checkout.
 * Strict Privacy: Never stores or exposes representative phone numbers publicly.
 * Inactive Handling: Suspended representative storefronts do NOT create or continue commission attribution.
 */

export interface PublicRepresentative {
  id: string;
  name: string;
  repUsername: string;
  avatar: string;
  tagline: string;
  rank: string;
  joinedYear: string;
  storeUrl: string;
  favoriteProduct: string;
  isSuspended?: boolean;
}

const ATTRIBUTION_STORAGE_KEY = 'ilovesurprises_attributed_rep_v1';
const ATTRIBUTION_TIMESTAMP_KEY = 'ilovesurprises_rep_timestamp_v1';
const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 60;

export const DEFAULT_REPRESENTATIVES: PublicRepresentative[] = [];

export const representativeService = {
  /**
   * Checks whether a representative is currently suspended in admin memberships or records
   */
  isRepresentativeSuspended(usernameOrId: string): boolean {
    if (!usernameOrId) return false;
    const clean = usernameOrId.toLowerCase().trim().replace(/^@/, '');
    try {
      if (typeof window !== 'undefined') {
        const storedMems = localStorage.getItem('ils_admin_memberships_v1');
        if (storedMems) {
          const mems = JSON.parse(storedMems);
          const match = mems.find(
            (m: { repUsername?: string; representativeId?: string; status?: string }) =>
              m.repUsername?.toLowerCase() === clean ||
              m.representativeId?.toLowerCase() === clean
          );
          if (match && (match.status === 'suspended' || match.status === 'cancelled')) {
            return true;
          }
        }

        const storedReps = localStorage.getItem('ils_admin_representatives_v1');
        if (storedReps) {
          const reps = JSON.parse(storedReps);
          const match = reps.find(
            (r: { repUsername?: string; id?: string; status?: string }) =>
              r.repUsername?.toLowerCase() === clean ||
              r.id?.toLowerCase() === clean
          );
          if (match && match.status === 'suspended') {
            return true;
          }
        }
      }
    } catch {
      // fallback
    }
    return false;
  },

  /**
   * Retrieves currently attributed representative from localStorage (if still within attribution window)
   */
  getAttributedRepresentative(): PublicRepresentative | null {
    if (typeof window === 'undefined') return null;

    try {
      // Check attribution window expiry
      const timestampStr = localStorage.getItem(ATTRIBUTION_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = Date.now();
        const maxAge = DEFAULT_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        if (now - timestamp > maxAge) {
          // Expired
          this.clearAttributedRepresentative();
          return null;
        }
      }

      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (stored) {
        const parsed: PublicRepresentative = JSON.parse(stored);
        parsed.isSuspended = this.isRepresentativeSuspended(parsed.repUsername);
        return parsed;
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Sets or updates the active representative attribution
   */
  setAttributedRepresentative(repOrUsername: PublicRepresentative | string): PublicRepresentative | null {
    let targetRep: PublicRepresentative | null = null;

    if (typeof repOrUsername === 'string') {
      targetRep = this.lookupRepresentative(repOrUsername) || {
        id: `rep-custom-${Date.now()}`,
        name: repOrUsername.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        repUsername: repOrUsername.toLowerCase().trim(),
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
        tagline: 'Your Independent Surprise Consultant ✨',
        rank: 'VIP Partner',
        joinedYear: '2026',
        storeUrl: `https://ilovesurprises.com/${repOrUsername.toLowerCase().trim()}`,
        favoriteProduct: 'Tahitian Vanilla & Gold Cash Candle',
      };
    } else {
      targetRep = { ...repOrUsername };
    }

    if (targetRep) {
      targetRep.isSuspended = this.isRepresentativeSuspended(targetRep.repUsername);
    }

    if (typeof window !== 'undefined' && targetRep) {
      try {
        localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(targetRep));
        localStorage.setItem(ATTRIBUTION_TIMESTAMP_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent('ils_representative_attributed', { detail: targetRep }));
      } catch (err) {
        console.error('Failed to store representative attribution', err);
      }
    }

    return targetRep;
  },

  /**
   * Clears representative attribution
   */
  clearAttributedRepresentative(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      localStorage.removeItem(ATTRIBUTION_TIMESTAMP_KEY);
      window.dispatchEvent(new CustomEvent('ils_representative_attributed', { detail: null }));
    }
  },

  /**
   * Look up representative by username
   */
  lookupRepresentative(username: string): PublicRepresentative | null {
    if (!username) return null;
    const clean = username.toLowerCase().trim().replace(/^@/, '');
    const found = DEFAULT_REPRESENTATIVES.find((r) => r.repUsername.toLowerCase() === clean);
    if (!found) return null;
    return {
      ...found,
      isSuspended: this.isRepresentativeSuspended(found.repUsername),
    };
  },

  /**
   * Returns list of default verified consultants
   */
  getAllActiveRepresentatives(): PublicRepresentative[] {
    return DEFAULT_REPRESENTATIVES.map((r) => ({
      ...r,
      isSuspended: this.isRepresentativeSuspended(r.repUsername),
    }));
  },
};
