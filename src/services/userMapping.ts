/**
 * Shared mapping between the backend's authenticated user payload and the
 * frontend `UserProfile` shape.
 *
 * Kept in its own module (depending on nothing but types and role utilities)
 * so both `accountService` and `customerAuthService` can use it without
 * forming an import cycle.
 */

import { normalizeRole } from '../utils/roleUtils';
import type { UserProfile } from '../types';

/** The `user` object returned inside `data` by the backend auth/user endpoints. */
export interface BackendUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendAuthPayload {
  user: BackendUser;
  token: string;
}

export const DEFAULT_AVATAR = '/assets/ilovesurprises/Profile/profile image.webp';

/**
 * Maps an authenticated backend user onto the frontend profile shape.
 *
 * The role is taken verbatim from the backend response and normalized; it is
 * never inferred from an email address, defaulted upward, or supplied by the
 * caller. `normalizeRole` resolves anything unrecognized to 'customer', so an
 * unexpected value can never escalate to admin.
 *
 * `previous` supplies only presentation-level fields the backend does not
 * store (avatar, mobile, referral handles).
 */
export function mapBackendUser(
  backendUser: BackendUser,
  previous?: UserProfile | null
): UserProfile {
  const fullName = [backendUser.firstName, backendUser.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const fallbackName =
    previous?.name ||
    (backendUser.email ? backendUser.email.split('@')[0] : 'Valued Customer');

  return {
    id: backendUser.id,
    name: fullName || fallbackName,
    email: backendUser.email,
    role: normalizeRole(backendUser.role) as UserProfile['role'],
    avatar: previous?.avatar || DEFAULT_AVATAR,
    createdAt: backendUser.createdAt
      ? new Date(backendUser.createdAt).toISOString()
      : previous?.createdAt || new Date().toISOString(),
    mobile: previous?.mobile,
    repUsername: previous?.repUsername,
    sponsorUsername: previous?.sponsorUsername,
  };
}
