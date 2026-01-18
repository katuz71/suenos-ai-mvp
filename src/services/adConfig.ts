import { TestIds } from 'react-native-google-mobile-ads';

// Твои реальные ID
const REAL_BANNER_ID = 'ca-app-pub-8147866560220122/1165099709';
const REAL_REWARDED_ID = 'ca-app-pub-8147866560220122/2478181377';

export const adConfig = {
  // Если мы в режиме разработки - берем тестовый ID. 
  // Если собрали APK - берем настоящий.
  bannerId: __DEV__ ? TestIds.BANNER : REAL_BANNER_ID,
  rewardedId: __DEV__ ? TestIds.REWARDED : REAL_REWARDED_ID,
};