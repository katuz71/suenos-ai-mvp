import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#120d26' },
        }}
      >
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
