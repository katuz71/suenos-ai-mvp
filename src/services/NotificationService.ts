import * as Notifications from 'expo-notifications';
import { supabase } from './supabase'; 
import { Platform } from 'react-native';

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
    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
    console.log('Push Token retrieved');

    await saveTokenToSupabase(token);
  } catch (error) {
    console.log('Error getting token:', error);
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

// 4. Schedule daily morning reminder
export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Set trigger to 08:30 AM as per Strategy
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
    },
    trigger,
  });
  console.log("Daily reminder scheduled at 08:30");
}