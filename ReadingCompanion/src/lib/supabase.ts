import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Minimal storage adapter so Supabase Auth can persist session in iOS Keychain
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const v = await SecureStore.getItemAsync(key);
    return v ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] as string;
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    // Important on RN: no URL hash parsing
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});


