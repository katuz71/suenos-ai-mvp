import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  repeat: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
}

export class NotificationService {
  // Планирование ежедневного гороскопа
  static async scheduleDailyHoroscope(userName: string, zodiacSign: string) {
    try {
      // Отменяем предыдущее уведомление если есть
      await this.cancelNotification('daily-horoscope');

      const notification: NotificationSchedule = {
        id: 'daily-horoscope',
        title: 'Твой персональный прогноз готов! ✨',
        body: `${userName}, узнай, что приготовили звезды для ${zodiacSign}.`,
        hour: 9,
        minute: 0,
        repeat: 'daily'
      };

      await this.scheduleNotification(notification);
      console.log('✅ Daily horoscope notification scheduled');
    } catch (error) {
      console.error('Error scheduling daily horoscope:', error);
    }
  }

  // Планирование напоминания о медитации снов
  static async scheduleDreamReminder() {
    try {
      // Отменяем предыдущее уведомление если есть
      await this.cancelNotification('dream-reminder');

      const notification: NotificationSchedule = {
        id: 'dream-reminder',
        title: 'Время для снов 🌙',
        body: 'Запиши свой сон и узнай его тайное значение от Луны',
        hour: 22,
        minute: 0,
        repeat: 'daily'
      };

      await this.scheduleNotification(notification);
      console.log('✅ Dream reminder notification scheduled');
    } catch (error) {
      console.error('Error scheduling dream reminder:', error);
    }
  }

  // Планирование еженедельного оракула
  static async scheduleWeeklyOracle() {
    try {
      // Отменяем предыдущее уведомление если есть
      await this.cancelNotification('weekly-oracle');

      const notification: NotificationSchedule = {
        id: 'weekly-oracle',
        title: 'Сфера Судьбы ждёт тебя 🔮',
        body: 'Задай мистический вопрос и получи ответ от вселенной',
        hour: 15,
        minute: 0,
        repeat: 'weekly'
      };

      await this.scheduleNotification(notification);
      console.log('✅ Weekly oracle notification scheduled');
    } catch (error) {
      console.error('Error scheduling weekly oracle:', error);
    }
  }

  // Общее планирование уведомления
  static async scheduleNotification(schedule: NotificationSchedule) {
    try {
      // Сохраняем информацию об уведомлении
      await AsyncStorage.setItem(`notification_${schedule.id}`, JSON.stringify(schedule));

      // Создаем правильный триггер для уведомления
      let trigger;
      if (schedule.repeat === 'daily') {
        trigger = {
          hour: schedule.hour,
          minute: schedule.minute,
          repeats: true,
        };
      } else if (schedule.repeat === 'weekly') {
        trigger = {
          weekday: 1, // Понедельник
          hour: schedule.hour,
          minute: schedule.minute,
          repeats: true,
        };
      } else {
        trigger = {
          hour: schedule.hour,
          minute: schedule.minute,
          repeats: false,
        };
      }

      // Планируем уведомление
      await Notifications.scheduleNotificationAsync(schedule.id, {
        content: {
          title: schedule.title,
          body: schedule.body,
          data: { notificationId: schedule.id },
        },
        trigger: trigger,
      });

      console.log(`📅 Notification scheduled: ${schedule.title}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Отмена уведомления
  static async cancelNotification(id: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(`notification_${id}`);
      console.log(`🚫 Notification cancelled: ${id}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Отмена всех запланированных уведомлений
  static async cancelAllNotifications() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        await AsyncStorage.removeItem(`notification_${notification.identifier}`);
      }
      
      console.log('🚫 All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Получение списка запланированных уведомлений
  static async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Отправка немедленного уведомления
  static async sendImmediateNotification(title: string, body: string) {
    try {
      await Notifications.scheduleNotificationAsync('immediate', {
        content: {
          title,
          body,
          data: { immediate: true },
        },
        trigger: null, // Срабатывает немедленно
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Инициализация всех уведомлений при входе пользователя
  static async initializeUserNotifications(userName: string, zodiacSign: string) {
    try {
      console.log('🔔 Initializing user notifications...');
      
      // Отменяем старые уведомления
      await this.cancelAllNotifications();
      
      // Планируем новые
      await this.scheduleDailyHoroscope(userName, zodiacSign);
      await this.scheduleDreamReminder();
      await this.scheduleWeeklyOracle();
      
      console.log('✅ User notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing user notifications:', error);
    }
  }

  // Проверка разрешений на уведомления
  static async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Запрос разрешений на уведомления
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
}
