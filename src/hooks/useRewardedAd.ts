import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
// import { 
//   RewardedAd, 
//   RewardedAdEventType, 
//   TestIds 
// } from 'react-native-google-mobile-ads';
import { supabase } from '../services/supabase';
import { useMonetization } from './useMonetization';

export function useRewardedAd() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshStatus } = useMonetization();

  useEffect(() => {
    // Симуляция загрузки
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const grantReward = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();
      
      const newCredits = (profile?.credits || 0) + 1;

      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      await refreshStatus();
      Alert.alert('Успех!', 'Тестовая награда получена (+1 ✨)');
      
      // Перезагрузка "рекламы"
      setLoaded(false);
      setTimeout(() => setLoaded(true), 2000);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Сбой начисления');
    } finally {
      setLoading(false);
    }
  };

  const showAd = () => {
    Alert.alert(
      "Режим разработки",
      "Видео недоступно в Expo Go. Начислить награду сразу?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Да, начислить", onPress: grantReward }
      ]
    );
  };

  return { loaded, loading, showAd };
}
