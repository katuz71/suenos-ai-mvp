import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { 
  BannerAd, 
  BannerAdSize, 
  TestIds 
} from 'react-native-google-mobile-ads';
import { useMonetization } from '../hooks/useMonetization';

// Ваш реальный ID баннера (взят из energy.tsx)
// Если захотите создать отдельный баннер для Снов/Гороскопа - поменяйте этот ID
const productionAdUnitId = 'ca-app-pub-8147866560220122/6890947761';

const adUnitId = __DEV__ ? TestIds.BANNER : productionAdUnitId;

export default function AdBanner() {
  const { isPremium } = useMonetization();

  // Если у пользователя премиум, не показываем рекламу
  if (isPremium) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
           console.log('AdBanner error:', error);
           // Здесь можно было бы вернуть null, чтобы скрыть место,
           // но пока оставим как есть, чтобы видеть ошибки в логах
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    // Убрали стили "заглушки" (рамки и цвет), чтобы реклама выглядела чисто
  },
});