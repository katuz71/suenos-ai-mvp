import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';
// import { TestIds, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

// 🛠 НАСТРОЙКИ
const MOCK_PAYMENT = true; // Пока true для тестов
// const AD_UNIT_ID = TestIds.REWARDED; // Тестовый ID рекламы

// Предзагрузка рекламы
// const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
//   keywords: ['horoscope', 'dream', 'astrology'],
// });

export const useMonetization = () => {
  const [isPremium, setIsPremium] = useState(false); // <-- Используем isPremium
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);

  // 1. Получение данных из Supabase
  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, credits') // <-- Твои поля
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setIsPremium(data.is_premium);
        setCredits(data.credits);
      }
    } catch (e) {
      console.error('Error fetching status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Слушатели рекламы (временно отключено)
  useEffect(() => {
    fetchStatus();

    // Временно отключаем рекламу
    setAdLoaded(false);

    // const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    //   setAdLoaded(true);
    // });

    // const unsubscribeEarned = rewarded.addAdEventListener(
    //   RewardedAdEventType.EARNED_REWARD,
    //   async () => {
    //     console.log('Реклама просмотрена');
    //     await addCredit(); // Начисляем +1
    //   }
    // );

    // rewarded.load();

    // return () => {
    //   unsubscribeLoaded();
    //   unsubscribeEarned();
    // };
  }, []);

  // 3. Начисление кредита (+1)
  const addCredit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // В идеале использовать RPC, но пока сделаем прямой update
    // Сначала получаем актуальное число, чтобы не ошибиться
    const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).maybeSingle();
    const currentCredits = data?.credits || 0;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: currentCredits + 1 })
      .eq('id', user.id);
    
    if (!error) {
      setCredits(currentCredits + 1);
      Alert.alert("Energía Recibida", "Has obtenido 1 crédito de interpretación.");
    }
  };

  // 4. Покупка Premium (Mock)
  const buyPremium = async () => {
    setLoading(true);
    if (MOCK_PAYMENT) {
      await new Promise(r => setTimeout(r, 1000)); // Имитация сети
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true }) // <-- Пишем в is_premium
          .eq('id', user.id);
        
        if (!error) {
          setIsPremium(true);
          Alert.alert("¡Felicidades!", "Ahora tienes acceso ilimitado.");
        }
      }
    }
    setLoading(false);
    return true;
  };

  // 5. Показать Рекламу (временно отключено)
  const showAd = () => {
    // Временно отключаем рекламу
    Alert.alert("Реклама отключена", "Функция рекламы временно отключена для теста. Получите 1 бесплатный кредит!");
    
    // Временно начисляем кредит автоматически
    addCredit();
    
    // if (adLoaded) {
    //   rewarded.show();
    //   setAdLoaded(false); 
    //   rewarded.load(); // Грузим следующую
    // } else {
    //   Alert.alert("Cargando...", "Buscando señales en el éter (Cargando anuncio)...");
    //   rewarded.load();
    // }
  };

  // 6. Списание кредита (Потребление)
  const consumeCredit = async (): Promise<boolean> => {
    console.log("💰 [DEBUG] consumeCredit called");
    console.log("💰 [DEBUG] isPremium:", isPremium);
    console.log("💰 [DEBUG] current credits:", credits);
    
    if (isPremium) {
      console.log("💰 [DEBUG] User is premium, returning true");
      return true; // Premium не тратит кредиты
    }

    if (credits > 0) {
      console.log("💰 [DEBUG] Has credits, attempting to consume one");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("💰 [DEBUG] No user found, returning false");
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', user.id);
      
      if (!error) {
        console.log("💰 [DEBUG] Successfully consumed credit, updating local state");
        setCredits(prev => prev - 1);
        return true; // Успешно списали
      } else {
        console.log("💰 [DEBUG] Error consuming credit:", error);
      }
    } else {
      console.log("💰 [DEBUG] No credits available");
    }
    
    console.log("💰 [DEBUG] Returning false - no energy");
    return false; // Нет кредитов
  };

  // 6. Проверка ежедневного пополнения энергии
  const checkDailyEnergy = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || isPremium) return false;

      // Получаем профиль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, last_energy_gift')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) return false;

      const now = new Date();
      const lastGift = profile.last_energy_gift ? new Date(profile.last_energy_gift) : null;
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Проверяем, прошло ли 24 часа и меньше ли 3 кредитов
      if ((!lastGift || lastGift < twentyFourHoursAgo) && profile.credits < 3) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            credits: profile.credits + 1,
            last_energy_gift: now.toISOString()
          })
          .eq('id', user.id);

        if (!error) {
          console.log("✨ [DAILY] Начислен ежедневный кредит");
          setCredits(prev => prev + 1);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking daily energy:', error);
      return false;
    }
  };

  // 7. Принудительное обновление статуса пользователя
  const refreshStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('credits, is_premium')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setCredits(data.credits || 0);
        setIsPremium(data.is_premium || false);
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  return { 
    isPremium, 
    credits, 
    loading, 
    buyPremium, 
    showAd, 
    adLoaded, 
    consumeCredit, 
    checkDailyEnergy,
    refreshStatus,
  };
};
