import { TestIds } from 'react-native-google-mobile-ads';

/**
 * AdMob Configuration
 * Real IDs are used for production builds (APK/AAB)
 * Test IDs are used for local development
 */
const REAL_BANNER_ID = 'ca-app-pub-8147866560220122/1165099709';
const REAL_REWARDED_ID = 'ca-app-pub-8147866560220122/2478181377';

export const adConfig = {
  bannerId: __DEV__ ? TestIds.BANNER : REAL_BANNER_ID,
  rewardedId: __DEV__ ? TestIds.REWARDED : REAL_REWARDED_ID,
};