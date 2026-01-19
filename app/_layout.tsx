import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
// Добавляем импорт RevenueCat
import Purchases from 'react-native-purchases';

// Удерживаем Splash Screen, пока не загрузим всё
SplashScreen.preventAutoHideAsync();

// Константа ключа (вынесли для удобства)
const REVENUECAT_API_KEY = "goog_aaxbLkokrPUPPmBBcNzInhlJHFY";

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Принудительно загружаем шрифты иконок
        await Font.loadAsync(Ionicons.font);

        // 2. Инициализируем RevenueCat ПРИ СТАРТЕ
        // Устанавливаем уровень логов DEBUG, чтобы избежать ошибки customLogHandler
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); 
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        
        console.log("✅ RevenueCat глобально инициализирован");

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
        <Stack.Screen name="paywall" />
      </Stack>
    </AuthProvider>
  );
}