/**
 * Google Identity Services (GIS) integration.
 *
 * Obtains a REAL Google credential in the browser and hands it to the backend
 * for verification. The frontend never decides who a user is: it only forwards
 * a Google-issued token to `POST /api/auth/google`, and the backend
 * (backend/src/services/auth.service.ts) validates it with `google-auth-library`
 * or Google's tokeninfo/userinfo endpoints before issuing a session.
 *
 * A manually typed email address is never an acceptable credential and this
 * module provides no way to produce one.
 *
 * Two flows are supported, both real:
 *   - `requestAccessToken()` — OAuth 2.0 implicit token client. Returns a
 *     Google `access_token`, which the backend exchanges for the verified
 *     profile at `https://www.googleapis.com/oauth2/v3/userinfo`. This is used
 *     by the styled "Continue with Google" button so the existing design is
 *     preserved.
 *   - `requestIdTokenCredential()` — One Tap / ID-token flow, returning a
 *     signed JWT credential the backend verifies against the client ID.
 */

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = 'google-identity-services';

const GOOGLE_CLIENT_ID = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || ''
).trim();

/** Minimal shapes for the parts of the GIS API used here. */
interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, any>) => void;
          prompt: (listener?: (notification: any) => void) => void;
          cancel: () => void;
        };
        oauth2?: {
          initTokenClient: (config: Record<string, any>) => {
            requestAccessToken: (overrides?: Record<string, any>) => void;
          };
        };
      };
    };
  }
}

export class GoogleAuthError extends Error {
  readonly code:
    | 'not_configured'
    | 'script_blocked'
    | 'popup_closed'
    | 'denied'
    | 'unavailable';

  constructor(message: string, code: GoogleAuthError['code']) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
  }
}

/** True when a public Google OAuth client ID is configured for this build. */
export function isGoogleAuthConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function getGoogleClientId(): string {
  return GOOGLE_CLIENT_ID;
}

let scriptPromise: Promise<void> | null = null;

/** Loads the GIS client script once, reusing the in-flight promise. */
function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new GoogleAuthError('Google sign-in requires a browser.', 'unavailable')
    );
  }

  if (window.google?.accounts) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;

    const fail = () => {
      scriptPromise = null;
      reject(
        new GoogleAuthError(
          'Could not load Google sign-in. A browser extension, ad blocker, or network policy may be blocking accounts.google.com.',
          'script_blocked'
        )
      );
    };

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', fail, { once: true });
      // Already loaded between the check above and now.
      if (window.google?.accounts) resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        resolve();
      } else {
        fail();
      }
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function assertConfigured(): void {
  if (!isGoogleAuthConfigured()) {
    throw new GoogleAuthError(
      'Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID to the public OAuth client ID that matches the backend GOOGLE_CLIENT_ID.',
      'not_configured'
    );
  }
}

/**
 * Opens Google's account chooser and resolves with a real OAuth access token.
 * Rejects if sign-in is not configured, the script is blocked, or the user
 * dismisses or denies the prompt.
 */
export async function requestAccessToken(): Promise<string> {
  assertConfigured();
  await loadGisScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2?.initTokenClient) {
    throw new GoogleAuthError(
      'The Google sign-in library loaded but the OAuth token client is unavailable.',
      'unavailable'
    );
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response: GoogleTokenResponse) => {
        if (settled) return;
        settled = true;

        if (response.access_token) {
          resolve(response.access_token);
          return;
        }
        reject(
          new GoogleAuthError(
            response.error_description ||
              response.error ||
              'Google did not return an access token.',
            'denied'
          )
        );
      },
      error_callback: (err: { type?: string; message?: string }) => {
        if (settled) return;
        settled = true;

        const code: GoogleAuthError['code'] =
          err?.type === 'popup_closed' ? 'popup_closed' : 'denied';
        reject(
          new GoogleAuthError(
            code === 'popup_closed'
              ? 'Google sign-in was cancelled.'
              : err?.message || 'Google sign-in could not be completed.',
            code
          )
        );
      },
    });

    client.requestAccessToken();
  });
}

/**
 * One Tap / ID-token flow. Resolves with a signed Google JWT credential that
 * the backend verifies against the configured client ID.
 */
export async function requestIdTokenCredential(): Promise<string> {
  assertConfigured();
  await loadGisScript();

  const idApi = window.google?.accounts?.id;
  if (!idApi) {
    throw new GoogleAuthError(
      'The Google Identity Services ID API is unavailable.',
      'unavailable'
    );
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    idApi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: GoogleCredentialResponse) => {
        if (settled) return;
        settled = true;
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(
            new GoogleAuthError('Google did not return a credential.', 'denied')
          );
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    idApi.prompt((notification: any) => {
      if (settled) return;
      const dismissed =
        typeof notification?.isNotDisplayed === 'function' &&
        (notification.isNotDisplayed() || notification.isSkippedMoment?.());
      if (dismissed) {
        settled = true;
        reject(
          new GoogleAuthError(
            'Google sign-in was dismissed or is unavailable in this browser.',
            'popup_closed'
          )
        );
      }
    });
  });
}

export const googleIdentityService = {
  isConfigured: isGoogleAuthConfigured,
  getClientId: getGoogleClientId,
  requestAccessToken,
  requestIdTokenCredential,
};
