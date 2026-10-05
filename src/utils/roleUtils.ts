/**
 * Canonical role normalization and authorization helpers.
 * Handles the mapping between backend uppercase role enums (ADMIN, CUSTOMER, AFFILIATE, STAFF)
 * and frontend client role representations without weakening authorization.
 */

export type CanonicalRole = 'admin' | 'customer' | 'representative' | 'staff';

/**
 * Safely normalizes any role string to a canonical frontend role.
 * - 'ADMIN' / 'admin' -> 'admin'
 * - 'AFFILIATE' / 'affiliate' / 'REPRESENTATIVE' / 'representative' -> 'representative'
 * - 'STAFF' / 'staff' -> 'staff'
 * - 'CUSTOMER' / 'customer' (or unrecognized role) -> 'customer'
 *
 * Security: Arbitrary role strings NEVER resolve to 'admin'.
 */
export function normalizeRole(rawRole?: string | null): CanonicalRole {
  if (!rawRole || typeof rawRole !== 'string') {
    return 'customer';
  }
  const clean = rawRole.trim().toUpperCase();
  switch (clean) {
    case 'ADMIN':
      return 'admin';
    case 'AFFILIATE':
    case 'REPRESENTATIVE':
      return 'representative';
    case 'STAFF':
      return 'staff';
    case 'CUSTOMER':
      return 'customer';
    default:
      return 'customer';
  }
}

/**
 * Strictly checks whether the given role is an administrator role.
 * Case-insensitive comparison ensuring only 'ADMIN' or 'admin' returns true.
 * Does NOT allow arbitrary strings to gain admin privileges.
 */
export function isAdminRole(rawRole?: string | null): boolean {
  if (!rawRole || typeof rawRole !== 'string') {
    return false;
  }
  return rawRole.trim().toUpperCase() === 'ADMIN';
}

/**
 * Strictly checks whether the given role is an affiliate/representative role.
 */
export function isAffiliateRole(rawRole?: string | null): boolean {
  if (!rawRole || typeof rawRole !== 'string') {
    return false;
  }
  const clean = rawRole.trim().toUpperCase();
  return clean === 'AFFILIATE' || clean === 'REPRESENTATIVE';
}

/**
 * Strictly checks whether the given role is a staff role.
 */
export function isStaffRole(rawRole?: string | null): boolean {
  if (!rawRole || typeof rawRole !== 'string') {
    return false;
  }
  return rawRole.trim().toUpperCase() === 'STAFF';
}
