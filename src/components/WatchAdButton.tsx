import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
// 👇 Аналитика
import { AppEventsLogger } from 'react-native-fbsdk-next'; 
import analytics from '@react-native-firebase/analytics'; // ✅ Добавили Google
import MagicAlert from './MagicAlert';

const productionAdUnitId = 'ca-app-pub-8147866560220122/2478181377';
const adUnitId = __DEV__ ? TestIds.REWARDED : productionAdUnitId;

// Создаем инстанс рекламы один раз
const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'fortune', 'mystic'],
});

export default function WatchAdButton({ onReward }: { onReward?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [isEarned, setIsEarned] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    // 1. Загрузка
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      console.log('✅ [AD] Реклама загружена');
    });

    // 2. Награда (Самое важное!)
    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      setIsEarned(true);
      console.log('🎁 [AD] Награда получена');
      
      // --- ОТПРАВКА АНАЛИТИКИ ---
      
      // Facebook
      AppEventsLogger.logEvent('ad_watched_rewarded');
      
      // Google Analytics (Firebase)
      await analytics().logEvent('ad_watched_rewarded', {
        type: 'video',
        reward: 1
      });

      console.log('📨 [Analytics] События отправлены в FB и Google');
      // ---------------------------
    });

    // 3. Закрытие
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ [AD] Реклама закрыта');
      setLoaded(false);
      
      // Если награда была получена, начисляем энергию
      if (isEarned) {
        console.log('🎬 [AD] Запуск начисления энергии...');
        if (onReward) onReward();
        setAlertVisible(true);
        setIsEarned(false); 
      }
      
      // Грузим следующую
      console.log('🔄 [AD] Загружаем следующую...');
      rewarded.load();
    });

    // 4. Ошибка
    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (err) => {
      console.error('❌ [AD] Ошибка рекламы:', err.message);
      setLoaded(false);
    });

    // Запуск первой загрузки
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
        onPress={() => {
            if (loaded) {
                rewarded.show();
            } else {
                Alert.alert("Cargando", "El cosmos está preparando tu visión...");
            }
        }} 
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