import { Stack } from 'expo-router';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Удерживаем Splash Screen, пока не загрузим всё
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Принудительно загружаем шрифты иконок
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn(e);
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