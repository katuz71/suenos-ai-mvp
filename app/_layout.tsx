import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import mobileAds from 'react-native-google-mobile-ads';
import { Settings } from 'react-native-fbsdk-next';
// Импортируем наш новый сервис
import { registerForPushNotificationsAsync, scheduleDailyReminder } from '../src/services/NotificationService';

// Игнорируем ошибку сплэша
SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn("SplashScreen warning:", e);
});

const REVENUECAT_API_KEY = "goog_aaxbLkokrPUPPmBBcNzInhlJHFY";       

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Ionicons.font);

        // --- 1. Инициализация SDK ---
        await mobileAds().initialize();
        console.log("✅ AdMob: Инициализирован");       

        await Settings.initializeSDK();
        await Settings.setAdvertiserTrackingEnabled(true);
        console.log("✅ Meta SDK: Инициализирован");    

        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);        
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });    
        console.log("✅ RevenueCat: Инициализирован"); 

        // --- 2. Настройка Уведомлений ---
        // Запрашиваем права и сохраняем токен
        await registerForPushNotificationsAsync();
        // Ставим будильник на утро
        await scheduleDailyReminder();

      } catch (e) {
        console.warn("Ошибка при подготовке приложения:", e);
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