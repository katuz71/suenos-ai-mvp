import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import { 
//   BannerAd, 
//   BannerAdSize, 
//   TestIds 
// } from 'react-native-google-mobile-ads';
import { useMonetization } from '../hooks/useMonetization';

export default function AdBanner() {
  const { isPremium } = useMonetization();

  // Если у пользователя премиум, не показываем рекламу
  if (isPremium) {
    return null;
  }

  // Заглушка для Expo Go
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Рекламный баннер (Скрыт в Expo Go)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    height: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  placeholderText: {
    color: 'rgba(255, 215, 0, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
