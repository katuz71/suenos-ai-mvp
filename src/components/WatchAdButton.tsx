import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import MagicAlert from './MagicAlert';

const productionAdUnitId = 'ca-app-pub-8147866560220122/2478181377';
const adUnitId = __DEV__ ? TestIds.REWARDED : productionAdUnitId;

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'fortune', 'mystic'],
});

export default function WatchAdButton({ onReward }: { onReward?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [isEarned, setIsEarned] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      console.log('✅ [AD] Реклама загружена');
    });

    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      setIsEarned(true);
      console.log('🎁 [AD] Награда получена (событие AdMob)');
    });

    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ [AD] Реклама закрыта');
      setLoaded(false);
      if (isEarned) {
        console.log('🎬 [AD] Запуск начисления энергии через callback...');
        if (onReward) onReward();
        setAlertVisible(true);
        setIsEarned(false);
      }
      rewarded.load();
    });

    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (err) => {
      console.error('❌ [AD] Ошибка рекламы:', err.message);
      setLoaded(false);
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [onReward, isEarned]);

  return (
    <View>
      <TouchableOpacity 
        onPress={() => loaded ? rewarded.show() : Alert.alert("Cargando", "El cosmos está preparando tu visión...")} 
        disabled={!loaded}
        style={[styles.container, !loaded && { opacity: 0.6 }]}
      >
        <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.buttonGradient}>
          {loaded ? <Ionicons name="play-circle" size={24} color="#FFF" style={{ marginRight: 8 }} /> 
                  : <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />}
          <Text style={styles.buttonText}>{loaded ? "Ver Video (+1 ✨)" : "Cargando..."}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <MagicAlert 
        visible={alertVisible}
        title="¡Energía Recibida!"
        message="Los astros te han otorgado +1 de energía."
        icon="star"
        onConfirm={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, borderRadius: 25 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});