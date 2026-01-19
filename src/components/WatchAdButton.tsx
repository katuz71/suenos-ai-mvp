import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// 👇 ДОБАВИЛИ AdEventType в импорт
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { supabase } from '../services/supabase';
import MagicAlert from './MagicAlert';

// ВАШ РЕАЛЬНЫЙ ID РЕКЛАМНОГО БЛОКА
const productionAdUnitId = 'ca-app-pub-8147866560220122/2478181377';

const adUnitId = __DEV__ ? TestIds.REWARDED : productionAdUnitId;

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing', 'finance'],
});

interface WatchAdButtonProps {
  onReward?: () => void;
}

export default function WatchAdButton({ onReward }: WatchAdButtonProps) {
  const [loaded, setLoaded] = useState(false);
  const [isEarned, setIsEarned] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    icon: 'sparkles' 
  });

  const handleSaveReward = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + 1;

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;

      if (onReward) onReward();

      setAlertConfig({
        visible: true,
        title: "¡Energía Recibida!",
        message: "+1 Energía gracias a los astros.",
        icon: "star"
      });

    } catch (e) {
      console.error("Error saving reward:", e);
      Alert.alert("Error", "No se pudo guardar la energía.");
    }
  };

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      console.log('✅ AdMob: Реклама загружена');
    });

    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
      console.log('🎁 AdMob: Награда получена!');
      setIsEarned(true);
    });

    // 👇 ИСПРАВЛЕНО: Используем AdEventType.CLOSED вместо RewardedAdEventType.CLOSED
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ AdMob: Реклама закрыта');
      setLoaded(false);
      
      if (isEarned) {
        handleSaveReward();
        setIsEarned(false);
      }

      rewarded.load();
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, [isEarned]);

  const showAd = () => {
    if (loaded) {
      rewarded.show();
    } else {
      Alert.alert("Cargando...", "Conectando con el cosmos... espera un momento.");
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={showAd} 
        activeOpacity={0.8} 
        style={[styles.container, !loaded && { opacity: 0.6 }]}
        disabled={!loaded}
      >
        <LinearGradient
          colors={['#8E2DE2', '#4A00E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {!loaded ? (
             <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} />
          ) : (
             <Ionicons name="play-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
          )}
          
          <Text style={styles.buttonText}>
            {loaded ? "Ver Video (+1 ✨)" : "Cargando..."}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <MagicAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText="Gracias"
        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 25,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});