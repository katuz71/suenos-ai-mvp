import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import mobileAds from 'react-native-google-mobile-ads';
import { Settings } from 'react-native-fbsdk-next';
import * as Notifications from 'expo-notifications'; // 1. Импорт уведомлений

// Добавляем .catch, чтобы игнорировать ошибку, если сплэш уже скрыт
SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn("SplashScreen warning:", e);
});

const REVENUECAT_API_KEY = "goog_aaxbLkokrPUPPmBBcNzInhlJHFY";

// 2. Настройка поведения: показывать уведомления, даже если приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // ✅ Показывать баннер сверху
    shouldShowList: true,   // ✅ Оставлять в списке уведомлений
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Ionicons.font);

        // --- Инициализация SDK ---
        await mobileAds().initialize();
        console.log("✅ AdMob: Инициализирован");

        await Settings.initializeSDK();
        await Settings.setAdvertiserTrackingEnabled(true);
        console.log("✅ Meta SDK: Инициализирован");

        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); 
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        console.log("✅ RevenueCat: Инициализирован");

        // --- 3. Запрос прав на уведомления ---
        const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  console.log("✅ Push Notifications: Разрешено");
  
  // Получаем токен
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log("🚀 Expo Push Token:", tokenData.data);
  } catch (error) {
    console.log("Ошибка получения токена:", error);
  }
} else {
  console.log("⚠️ Push Notifications: Запрещено пользователем");
}

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