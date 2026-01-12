import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { supabase } from '../src/services/supabase';
import { Colors } from '../src/constants/Colors';
import '../src/i18n';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('[AUTH] Starting auth check...');
    
    const timeoutId = setTimeout(() => {
      console.log('[AUTH] Timeout reached (4s), forcing navigation to onboarding');
      setIsLoading(false);
      router.replace('/(auth)/onboarding');
    }, 4000);

    try {
      console.log('[AUTH] Checking for existing session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[AUTH] Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.log('[AUTH] No session found, redirecting to onboarding');
        clearTimeout(timeoutId);
        setIsLoading(false);
        router.replace('/(auth)/onboarding');
        return;
      }

      console.log('[AUTH] Session found, user ID:', session.user.id);
      console.log('[AUTH] Fetching user profile...');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, birth_date, zodiac_sign')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('[AUTH] Profile fetch error:', profileError);
        console.log('[AUTH] Signing out and redirecting to onboarding');
        await supabase.auth.signOut();
        clearTimeout(timeoutId);
        setIsLoading(false);
        router.replace('/(auth)/onboarding');
        return;
      }

      if (!profile || !profile.display_name) {
        console.log('[AUTH] Profile incomplete or missing, signing out');
        await supabase.auth.signOut();
        clearTimeout(timeoutId);
        setIsLoading(false);
        router.replace('/(auth)/onboarding');
        return;
      }

      console.log('[AUTH] Profile found:', profile.display_name);
      console.log('[AUTH] Redirecting to main tabs');
      clearTimeout(timeoutId);
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[AUTH] Unexpected error during auth check:', error);
      console.log('[AUTH] Signing out and redirecting to onboarding');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('[AUTH] Error signing out:', signOutError);
      }
      clearTimeout(timeoutId);
      setIsLoading(false);
      router.replace('/(auth)/onboarding');
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#120d26' },
        }}
      >
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="modal/paywall" 
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[Colors.background.primary, Colors.background.secondary]}
            style={styles.gradient}
          />
          <Text style={styles.splashIcon}>🌙</Text>
          <Text style={styles.splashTitle}>Sueños</Text>
          <ActivityIndicator size="large" color={Colors.accent.gold} style={styles.loader} />
          <Text style={styles.splashText}>Conectando con los astros...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    zIndex: 999,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  splashIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent.gold,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  splashText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
