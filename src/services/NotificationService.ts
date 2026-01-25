import * as Notifications from 'expo-notifications';
import { supabase } from './supabase'; 
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 1. Setup: Настройка поведения (показывать уведомление, даже если приложение открыто)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

// 2. Registration and token retrieval
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
    return undefined;
  }

  try {
    // Получаем Project ID для Expo SDK 49+
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    token = tokenData.data;
    console.log('Push Token retrieved:', token);

    await saveTokenToSupabase(token);
    
    return token;

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

      if (error) console.error('DB Error (Push):', error.message);
      else console.log('Token saved to Supabase');
    }
  } catch (e) {
    console.log('Error saveToken:', e);
  }
}

// 4. Schedule daily morning reminder (STRATEGY: 08:30 AM)
export async function scheduleDailyReminder() {
  try {
    // Сначала очищаем старые
    await Notifications.cancelAllScheduledNotificationsAsync();

    // ИСПРАВЛЕНИЕ ТИПОВ: Явное указание типа триггера
    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 30,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✨ Hora de la magia...",
        body: "¿Qué soñaste hoy? Cuéntaselo a Luna antes de que se desvanezca.",
        sound: true,
        data: { screen: 'input' },
      },
      trigger,
    });
    console.log("✅ Daily reminder scheduled at 08:30");
  } catch (error) {
    console.error("Error scheduling reminder:", error);
  }
}