import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { useMonetization } from './useMonetization';

export function useDailyBonus() {
  const { refreshStatus } = useMonetization();

  useEffect(() => {
    checkAndGrantDailyBonus();
  }, []);

  const checkAndGrantDailyBonus = async () => {
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found for daily bonus');
        return;
      }

      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, last_daily_bonus')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile for daily bonus:', profileError);
        return;
      }

      if (!profile) {
        console.log('Profile not found for daily bonus');
        return;
      }

      // Получаем текущую дату в формате YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      const lastBonus = profile.last_daily_bonus;

      // Проверяем, получал ли пользователь бонус сегодня
      if (lastBonus === today) {
        console.log('Daily bonus already claimed today');
        return;
      }

      // Начисляем бонус
      const newCredits = (profile.credits || 0) + 1;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: newCredits,
          last_daily_bonus: today
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating daily bonus:', updateError);
        Alert.alert('Ошибка', 'Не удалось начислить ежедневный бонус');
        return;
      }

      // Обновляем статус монетизации
      await refreshStatus();

      // Показываем уведомление
      Alert.alert(
        'Ежедневный бонус! ✨',
        'Вы получили +1 энергию за возвращение',
        [{ text: 'Отлично!', style: 'default' }]
      );

      console.log('Daily bonus granted successfully');

    } catch (error) {
      console.error('Error in daily bonus check:', error);
    }
  };

  return { checkAndGrantDailyBonus };
}
