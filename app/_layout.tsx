import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import mobileAds from 'react-native-google-mobile-ads';
import { Settings } from 'react-native-fbsdk-next';
import * as Notifications from 'expo-notifications'; // Добавляем импорт Expo Notifications
import { scheduleDailyReminder, registerForPushNotificationsAsync } from '../src/services/NotificationService';

LogBox.ignoreLogs(['new NativeEventEmitter']);

SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn("SplashScreen warning:", e);
});

// КЛЮЧИ REVENUECAT
const API_KEYS = {
  apple: "appl_YOUR_IOS_KEY_HERE", // <-- НЕ ЗАБУДЬ ВСТАВИТЬ КЛЮЧ IOS
  google: "goog_aaxbLkokrPUPPmBBcNzInhlJHFY"
};

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Assets
        await Font.loadAsync(Ionicons.font);

        // 2. AdMob
        await mobileAds().initialize(); 

        // 3. Meta SDK
        await Settings.setAdvertiserTrackingEnabled(true);
        await Settings.initializeSDK();
        await Settings.setAutoLogAppEventsEnabled(true);

        // 4. RevenueCat (Cross-platform fix)
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
            await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);        
            await Purchases.configure({ apiKey });    
        }

        // 5. УВЕДОМЛЕНИЯ: НОВАЯ ТИХАЯ ЛОГИКА
        // Не вызываем registerForPushNotificationsAsync() здесь!
        // Только проверяем, есть ли уже права.
        const { status } = await Notifications.getPermissionsAsync();
        
        if (status === 'granted') {
           // Если права УЖЕ есть (вернувшийся юзер), обновляем расписание
           await scheduleDailyReminder();
           console.log("Notifications: Schedule updated (Silent check)");
        } else {
           console.log("Notifications: Permission not yet granted. Waiting for user action.");
        }

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
        <Stack.Screen name="energy" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}