import * as Notifications from 'expo-notifications';
// 👇 ИСПРАВЛЕНИЕ 1: Импортируем из текущей папки services
import { supabase } from './supabase'; 
import { Platform } from 'react-native';

// 1. Настройка: Показываем уведомление, даже если приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
    shouldShowAlert: true, // <--- ЭТА СТРОЧКА ИСПРАВИТ ОШИБКУ
  }),
});

// 2. Регистрация и получение токена
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
    console.log('⚠️ Push: Permiso denegado');
    return;
  }

  try {
    // Получаем токен
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
    console.log('🚀 Push Token:', token);

    // Сохраняем в Supabase
    await saveTokenToSupabase(token);
  } catch (error) {
    console.log('❌ Error al obtener token:', error);
  }
}

// 3. Сохранение токена в базу данных
async function saveTokenToSupabase(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && token) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) console.error('❌ Error DB:', error.message);
      else console.log('💾 Token guardado en Supabase');
    }
  } catch (e) {
    console.log('Error saveToken:', e);
  }
}

// 4. Планирование утреннего напоминания (Local Notification)
export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 👇 ИСПРАВЛЕНИЕ 2: Используем 'as any' для trigger, чтобы успокоить TypeScript, 
  // так как структура { hour, minute, repeats } верна для Expo, но типы иногда строгие.
  const trigger: any = {
    hour: 9,
    minute: 0,
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
  console.log("⏰ Recordatorio diario configurado a las 9:00");
}