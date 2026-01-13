import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../src/services/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecked(true);
    }).catch((err) => {
      console.error("Auth Error:", err);
      setIsAuthChecked(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait for navigation and auth check
    if (!isAuthChecked || !navigationState?.key) return;

    const inTabs = segments[0] === '(tabs)';
    const inRoot = segments.length === 0;

    if (session) {
      // If user is logged in and not in tabs, redirect to suenos
      if (!inTabs) {
        router.replace('/(tabs)/suenos');
      }
    } else {
      // If user is not logged in and not at root, allow onboarding
      if (!inRoot) {
        router.replace('/');
      }
    }
  }, [session, isAuthChecked, segments, navigationState?.key]);

  // Show loading spinner while checking auth
  if (!isAuthChecked || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Slot />
    </View>
  );
}
