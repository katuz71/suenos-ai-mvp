import * as Notifications from 'expo-notifications';
import { supabase } from './supabase'; 
import { Platform } from 'react-native';
import Constants from 'expo-constants'; // Рекомендуется для стабильности

// 1. Setup: Show notifications even if the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Registration and token retrieval
// ВАЖНО: Теперь функция возвращает Promise<string | undefined>
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push: Permission denied');
    return undefined; // Возвращаем undefined, если отказали
  }

  try {
    // Получаем Project ID безопасно (важно для Expo SDK 49+)
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId, // Если projectId undefined, Expo попытается найти его сама
    });
    
    token = tokenData.data;
    console.log('Push Token retrieved:', token);

    await saveTokenToSupabase(token);
    
    return token; // <--- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Возвращаем токен UI-компоненту

  } catch (error) {
    console.log('Error getting token:', error);
    return undefined;
  }
}

// 3. Save token to Database
async function saveTokenToSupabase(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && token) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) console.error('DB Error:', error.message);
      else console.log('Token saved to Supabase');
    }
  } catch (e) {
    console.log('Error saveToken:', e);
  }
}

// 4. Schedule daily morning reminder (STRATEGY: 08:30 AM)
export async function scheduleDailyReminder() {
  try {
    // Сначала очищаем старые, чтобы не дублировать
    await Notifications.cancelAllScheduledNotificationsAsync();

    const trigger: any = {
      hour: 8,
      minute: 30,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✨ Hora de la magia...",
        body: "¿Qué soñaste hoy? Escríbelo antes de que se desvanezca.",
        sound: true,
        data: { screen: 'input' }, // Полезно для редиректа при клике
      },
      trigger,
    });
    console.log("✅ Daily reminder scheduled at 08:30");
  } catch (error) {
    console.error("Error scheduling reminder:", error);
  }
}