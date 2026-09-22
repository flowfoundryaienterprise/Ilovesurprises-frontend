import { representativeService, DEFAULT_REPRESENTATIVES } from './representativeService';

export interface SponsorRelationship {
  repUsername: string;
  sponsorUsername: string;
  upline: string[]; // [L1, L2, L3, L4, L5]
  registeredAt: string;
  userId?: string;
}

const SPONSOR_REGISTRY_KEY = 'ilovesurprises_sponsor_tree_v1';

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'api',
  'auth',
  'login',
  'signup',
  'register',
  'account',
  'shop',
  'store',
  'cart',
  'checkout',
  'rep',
  'affiliate',
  'orders',
  'categories',
  'rewards',
  'appraisal',
  'contact',
  'about',
  'support',
]);

export const sponsorService = {
  /**
   * Normalizes representative username consistently
   */
  normalizeUsername(username: string): string {
    if (!username) return '';
    return username
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  },

  /**
   * Validates username structure and constraints
   */
  validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || !username.trim()) {
      return { valid: false, error: 'Username is required.' };
    }

    const rawClean = username.trim().replace(/^@/, '');
    if (/[^a-zA-Z0-9_\s-]/.test(rawClean)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }

    const normalized = this.normalizeUsername(username);

    if (!normalized || normalized.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters.' };
    }

    if (normalized.length > 30) {
      return { valid: false, error: 'Username cannot exceed 30 characters.' };
    }

    if (RESERVED_USERNAMES.has(normalized)) {
      return { valid: false, error: `"${normalized}" is a reserved system handle. Please choose another.` };
    }

    return { valid: true };
  },

  /**
   * Checks if username is available (unique across default reps and sponsor registry)
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const normalized = this.normalizeUsername(username);
    const validation = this.validateUsername(normalized);
    if (!validation.valid) return false;

    // 1. Check default top representatives
    const inDefaults = DEFAULT_REPRESENTATIVES.some(
      (r) => r.repUsername.toLowerCase() === normalized
    );
    if (inDefaults) return false;

    // 2. Check local sponsor registry
    const registry = this.getStoredRegistry();
    if (registry[normalized]) return false;

    return true;
  },

  /**
   * Resolves a sponsor by username or active session attribution
   */
  async resolveSponsor(sponsorInput?: string): Promise<{ username: string; name?: string; id?: string } | null> {
    let candidate = sponsorInput ? this.normalizeUsername(sponsorInput) : '';

    if (!candidate) {
      const sessionRep = representativeService.getAttributedRepresentative()?.repUsername;
      if (sessionRep) {
        candidate = this.normalizeUsername(sessionRep);
      }
    }

    if (!candidate) return null;

    // Check if sponsor is suspended
    if (representativeService.isRepresentativeSuspended(candidate)) {
      return null;
    }

    // 1. Check default representatives
    const defaultRep = DEFAULT_REPRESENTATIVES.find(
      (r) => r.repUsername.toLowerCase() === candidate
    );
    if (defaultRep) {
      return { username: defaultRep.repUsername, name: defaultRep.name, id: defaultRep.id };
    }

    // 2. Check stored sponsor registry
    const registry = this.getStoredRegistry();
    if (registry[candidate]) {
      return { username: candidate };
    }

    return null;
  },

  /**
   * Builds the 5-level upline for a representative with strict circular reference prevention
   * Example: Rep A -> Rep B -> Rep C -> Rep D -> Rep E -> Rep F
   */
  async buildUpline(sponsorUsername: string, newRepUsername?: string): Promise<string[]> {
    const upline: string[] = [];
    const visited = new Set<string>();

    const cleanNewRep = newRepUsername ? this.normalizeUsername(newRepUsername) : null;
    let currentSponsor = this.normalizeUsername(sponsorUsername);

    // If new rep attempts to sponsor itself: reject circular cycle
    if (cleanNewRep && currentSponsor === cleanNewRep) {
      throw new Error(`Circular sponsor relationship detected: Representative cannot be their own sponsor.`);
    }

    const registry = this.getStoredRegistry();

    while (currentSponsor && upline.length < 5) {
      // Cycle detection: check if node has already been visited in ancestor chain
      if (visited.has(currentSponsor)) {
        throw new Error(`Circular sponsor relationship detected at "${currentSponsor}". Hierarchy rejected.`);
      }

      if (cleanNewRep && currentSponsor === cleanNewRep) {
        throw new Error(`Circular sponsor cycle detected: "${currentSponsor}" appears in ancestor upline.`);
      }

      visited.add(currentSponsor);
      upline.push(currentSponsor);

      // Resolve the next ancestor sponsor
      let nextSponsor: string | null = null;

      if (registry[currentSponsor]?.sponsorUsername) {
        nextSponsor = registry[currentSponsor].sponsorUsername;
      }

      currentSponsor = nextSponsor ? this.normalizeUsername(nextSponsor) : '';
    }

    return upline;
  },

  /**
   * Registers and permanently binds a representative to their sponsor and 5-level upline
   * Once registered, cannot be arbitrarily modified.
   */
  async registerSponsorRelationship(
    repUsername: string,
    sponsorUsername: string,
    upline: string[],
    userId?: string
  ): Promise<SponsorRelationship> {
    const cleanRep = this.normalizeUsername(repUsername);
    const cleanSponsor = this.normalizeUsername(sponsorUsername);

    // Prevent overwriting existing sponsor relationship (Lifetime immutability)
    const existing = this.getStoredRegistry()[cleanRep];
    if (existing && existing.sponsorUsername) {
      return existing;
    }

    const relationship: SponsorRelationship = {
      repUsername: cleanRep,
      sponsorUsername: cleanSponsor,
      upline,
      registeredAt: new Date().toISOString(),
      userId,
    };

    // 1. Persist to local / client registry
    this.saveToRegistry(cleanRep, relationship);

    // 2. Dispatch event for live UI reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ils_sponsor_registered', { detail: relationship })
      );
    }

    return relationship;
  },

  /**
   * Retrieves the 5-level upline array for a representative
   */
  async getUpline(repUsername: string): Promise<string[]> {
    const clean = this.normalizeUsername(repUsername);
    const registry = this.getStoredRegistry();

    if (registry[clean]?.upline && registry[clean].upline.length > 0) {
      return registry[clean].upline;
    }

    // If registered with sponsor but upline not precomputed, build dynamically
    if (registry[clean]?.sponsorUsername) {
      return this.buildUpline(registry[clean].sponsorUsername, clean);
    }

    return [];
  },

  /**
   * Generates the representative's official referral URL from their username
   */
  getReferralUrl(repUsername: string): string {
    const clean = this.normalizeUsername(repUsername);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';
    return `${origin}/rep/${clean}`;
  },

  /**
   * Internal storage helpers
   */
  getStoredRegistry(): Record<string, SponsorRelationship> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(SPONSOR_REGISTRY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveToRegistry(repUsername: string, relationship: SponsorRelationship): void {
    if (typeof window === 'undefined') return;
    try {
      const registry = this.getStoredRegistry();
      registry[repUsername] = relationship;
      localStorage.setItem(SPONSOR_REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      // ignore
    }
  },
};
