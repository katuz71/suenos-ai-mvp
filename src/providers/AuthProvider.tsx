import React, { useEffect, useState, ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useDailyBonus } from '../hooks/useDailyBonus';
import MagicAlert from '../components/MagicAlert';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [bonusAlertVisible, setBonusAlertVisible] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  
  useDailyBonus({
    onBonusGranted: () => setBonusAlertVisible(true),
    onError: (error) => console.error('Daily bonus error:', error)
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecked(true);
    }).catch((err) => {
      console.error("Auth Error:", err);
      setIsAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthChecked || !navigationState) return;

    const currentSegment = segments[0];
    const inTabs = currentSegment === '(tabs)';
    const inRoot = !currentSegment;
    const isPaywall = currentSegment === 'paywall';
    const isEnergy = currentSegment === 'energy';

    if (session) {
      if (isPaywall || isEnergy) {
        return;
      }
      
      if (inRoot) {
        router.replace('/(tabs)/suenos');
      }
    } else {
      if (!inRoot) {
        router.replace('/');
      }
    }
  }, [session, isAuthChecked, segments, navigationState]);

  if (!isAuthChecked || !navigationState) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <>
      {children}
      <MagicAlert 
        visible={bonusAlertVisible}
        title="Regalo de las Estrellas"
        message="El universo agradece tu retorno. Has recibido energía cósmica para tus consultas."
        icon="sparkles"
        confirmText="Recibir Energía"
        onConfirm={() => setBonusAlertVisible(false)}
      />
    </>
  );
}
