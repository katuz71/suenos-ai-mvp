import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import mobileAds from 'react-native-google-mobile-ads'; // Импорт AdMob

SplashScreen.preventAutoHideAsync();

const REVENUECAT_API_KEY = "goog_aaxbLkokrPUPPmBBcNzInhlJHFY";

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Ionicons.font);

        // 1. Инициализируем AdMob
        await mobileAds().initialize();
        console.log("✅ AdMob: Инициализирован");

        // 2. Инициализируем RevenueCat
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); 
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        console.log("✅ RevenueCat: Инициализирован");

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