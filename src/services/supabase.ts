import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function checkUsageLimit(userId: string): Promise<{
  canUse: boolean;
  isPremium: boolean;
  usageCount: number;
}> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, interpretation_count')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const isPremium = profile?.is_premium || false;
    const usageCount = profile?.interpretation_count || 0;

    if (isPremium) {
      return { canUse: true, isPremium: true, usageCount };
    }

    const canUse = usageCount < 1;

    return { canUse, isPremium: false, usageCount };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { canUse: false, isPremium: false, usageCount: 0 };
  }
}

export async function incrementUsageCount(userId: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('interpretation_count')
      .eq('id', userId)
      .single();

    const currentCount = profile?.interpretation_count || 0;

    await supabase
      .from('profiles')
      .update({ interpretation_count: currentCount + 1 })
      .eq('id', userId);
  } catch (error) {
    console.error('Error incrementing usage count:', error);
  }
}
