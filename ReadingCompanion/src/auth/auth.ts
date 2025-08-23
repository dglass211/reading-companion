// src/auth/auth.ts
// A tiny wrapper around Expo Auth Session (Google) and expo-apple-authentication (Apple)
// It normalizes the returned user into a common shape and stores it securely on device.

import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';
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

  // Create Supabase session from Apple identity token
  if (idToken) {
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken });
    if (error) {
      throw new Error(`Supabase Apple sign-in failed: ${error.message}`);
    }
    const { data: sess } = await supabase.auth.getSession();
    const supabaseUserId = sess.session?.user?.id;
    
    if (supabaseUserId) {
      // Use Supabase UUID for consistency
      const user: User = {
        id: supabaseUserId, // Use Supabase UUID instead of Apple user ID
        name: fullName ?? null,
        email: credential.email ?? null,
        avatarUrl: null, // Apple doesn't provide avatar
        provider: 'apple',
        idToken,
      };
      await saveUser(user);
      return user;
    }
  }

  // Fallback if no Supabase session (shouldn't happen)
  const user: User = {
    id: appleId,
    name: fullName ?? null,
    email: credential.email ?? null,
    avatarUrl: null,
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
    extraParams: {
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent to get refresh token
    },
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


  // Try multiple possible locations for the ID token
  const idToken: string = String(
    (tokenResponse as any).id_token ?? 
    (tokenResponse as any).idToken ?? 
    (tokenResponse as any).id_Token ?? 
    ''
  );


  if (!idToken || idToken === '') {
    console.error('[Auth] No ID token received from Google OAuth');
    console.log('[Auth] Full token response for debugging:', tokenResponse);
    throw new Error('Google sign-in succeeded but no ID token was received. Please check OAuth configuration.');
  }

  // Helper to decode JWT payload
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

  // Decode user info from the ID token for display
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
    // Swallow decoding issues
  }

  // Create Supabase session from Google ID token
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) {
    throw new Error(`Supabase Google sign-in failed: ${error.message}`);
  }
  
  // Get the Supabase user ID (not the Google sub)
  const { data: sess } = await supabase.auth.getSession();
  const supabaseUserId = sess.session?.user?.id;
  
  if (!supabaseUserId) {
    throw new Error('Supabase session created but no user ID found');
  }

  // Return user with Supabase UUID instead of Google sub
  const user: User = {
    id: supabaseUserId, // Use Supabase UUID for consistency
    name: name ?? null,
    email: email ?? null,
    avatarUrl: avatarUrl ?? null,
    provider: 'google',
    idToken,
  };
  await saveUser(user);
  return user;
}


