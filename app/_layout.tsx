import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import mobileAds from 'react-native-google-mobile-ads';
import { Settings } from 'react-native-fbsdk-next';
import { registerForPushNotificationsAsync, scheduleDailyReminder } from '../src/services/NotificationService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn("SplashScreen warning:", e);
});

const REVENUECAT_API_KEY = "goog_aaxbLkokrPUPPmBBcNzInhlJHFY";       

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Load basic assets
        await Font.loadAsync(Ionicons.font);

        // 2. Initialize AdMob
        await mobileAds().initialize();
        console.log("AdMob: Initialized");       

        // 3. Initialize Meta (Facebook) SDK with full tracking permissions
        // This is crucial for purchase analytics and ad optimization
        await Settings.setAdvertiserTrackingEnabled(true);
        await Settings.initializeSDK();
        await Settings.setAutoLogAppEventsEnabled(true);
        console.log("Meta SDK: Fully Initialized");    

        // 4. Initialize RevenueCat
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);        
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });    
        console.log("RevenueCat: Initialized"); 

        // 5. Setup Push Notifications
        await registerForPushNotificationsAsync();
        await scheduleDailyReminder();

      } catch (e) {
        console.warn("Error during app preparation:", e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="energy" />
      </Stack>
    </AuthProvider>
  );
}