// src/auth/auth.ts
// A tiny wrapper around Expo Auth Session (Google) and expo-apple-authentication (Apple)
// It normalizes the returned user into a common shape and stores it securely on device.

import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
// Newer AuthSession prefers AuthRequest + promptAsync over the old startAsync

// ---- Types
export type AuthProvider = 'apple' | 'google';
export type User = {
  id: string; // Stable user id (Apple: user, Google: sub)
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  provider: AuthProvider;
  idToken?: string; // We persist idToken so a future backend can verify it server-side and create an app session.
};

// Avoid characters some native layers reject; stick to [A-Za-z0-9_.-]
const SECURE_KEY = 'rc_user';

// ---- Helpers
export async function getCurrentUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(SECURE_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

async function saveUser(u: User) {
  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(u));
}

export async function signOut() {
  await SecureStore.deleteItemAsync(SECURE_KEY);
}

// ---- Sign in with Apple
// NOTE: Requires Dev Client / EAS build (won't work in Expo Go).
export async function signInWithApple(): Promise<User> {
  // Request full name & email on FIRST sign-in only (Apple sends them once)
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  // Apple returns a stable "user" string for this bundleIdentifier
  const appleId = credential.user;
  const fullName =
    [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ') || undefined;

  // Apple can include an identityToken (JWT) → useful for backend verification
  const idToken = credential.identityToken ?? undefined;

  const user: User = {
    id: appleId,
    name: fullName ?? null,
    email: credential.email ?? null,
    avatarUrl: null, // Apple doesn't provide avatar
    provider: 'apple',
    idToken,
  };
  await saveUser(user);
  return user;
}

// ---- Sign in with Google (OAuth using Expo Auth Session)
// 1) Create an iOS OAuth Client ID in Google Cloud & paste it in EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
// 2) The returned id_token is a Google-signed JWT (verify on your server if you add one)
export async function signInWithGoogle(): Promise<User> {
  const clientId = process.env['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'];
  if (!clientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }

  // Discovery and AuthRequest
  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
  // Google iOS requires the native redirect that matches your iOS client id scheme
  const iosClientPrefix = clientId.replace('.apps.googleusercontent.com', '');
  const nativeScheme = `com.googleusercontent.apps.${iosClientPrefix}`;
  const redirectUri = AuthSession.makeRedirectUri({ native: `${nativeScheme}:/oauthredirect` });
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code, // Use code + PKCE for iOS client
    usePKCE: true,
    scopes: ['openid', 'email', 'profile'],
  });
  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params?.['code']) {
    throw new Error(result.type === 'dismiss' ? 'Sign-in cancelled' : 'Google sign-in failed');
  }

  // Exchange authorization code for tokens using PKCE (no client secret needed for iOS installed app)
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: String(result.params['code']),
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier as string },
    },
    discovery
  );

  const idToken: string = String((tokenResponse as any).id_token ?? '');

  // Decode minimal fields from the JWT payload for display (NO security—just UI)
  // We avoid adding dependencies; best-effort base64url decode if possible.
  function base64UrlDecode(input: string): string | null {
    try {
      const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const atobFn: ((s: string) => string) | undefined = (global as any).atob;
      if (atobFn) {
        // decodeURIComponent(escape(...)) to handle UTF-8 safely
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        return decodeURIComponent(escape(atobFn(padded)));
      }
      return null;
    } catch {
      return null;
    }
  }

  let name: string | null | undefined;
  let email: string | null | undefined;
  let avatarUrl: string | null | undefined;
  try {
    const payload = idToken.split('.')[1] ?? '';
    const json = base64UrlDecode(payload);
    if (json) {
      const data = JSON.parse(json);
      name = (data.name as string | undefined) ?? null;
      email = (data.email as string | undefined) ?? null;
      avatarUrl = (data.picture as string | undefined) ?? null;
    }
  } catch {
    // Swallow decoding issues; we still return an id-only user
  }

  const sub = (() => {
    try {
      const payload = idToken.split('.')[1] ?? '';
      const json = base64UrlDecode(payload);
      if (json) return (JSON.parse(json).sub as string) ?? 'unknown';
    } catch {}
    return 'unknown';
  })();

  const user: User = {
    id: sub,
    name: name ?? null,
    email: email ?? null,
    avatarUrl: avatarUrl ?? null,
    provider: 'google',
    idToken,
  };
  await saveUser(user);
  return user;
}


