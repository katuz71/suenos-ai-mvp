import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const BONUS_DATE_KEY = 'daily_bonus_date_v1';
const DAILY_BONUS_AMOUNT = 1;

// ID вашего entitlement в RevenueCat (для подписок, если есть)
const ENTITLEMENT_ID = 'pro_access'; 

// МАППИНГ ПАКЕТОВ ЭНЕРГИИ (Важно для вашего магазина)
const ENERGY_VALUES: Record<string, number> = {
  'energy_10_v2': 10,
  'energy_50_v2': 50,
  'energy_150_v2': 150,
};

export const useMonetization = () => {
  const [credits, setCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const isProcessing = useRef(false);

  const checkPremiumStatus = useCallback((info: CustomerInfo) => {
    const isActive = typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    setIsPremium(isActive);
  }, []);

  // 1. Инициализация и слушатель RevenueCat
  useEffect(() => {
    const init = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        checkPremiumStatus(info);
      } catch (e) {
        console.log("RC Init Error", e);
      }
    };

    init();

    // Создаем функцию слушателя
    const customerInfoUpdateListener = (info: CustomerInfo) => {
      checkPremiumStatus(info);
    };

    // Подписываемся
    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      // Отписываемся, передавая ту же функцию
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, [checkPremiumStatus]);

  // 2. Получение баланса
  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Синхронизируем ID пользователя с RevenueCat
      await Purchases.logIn(user.id);

      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).maybeSingle();
      if (data) setCredits(data.credits || 0);
    } catch (e) { console.error('Fetch error:', e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // 3. Ежедневный бонус
  const checkDailyBonus = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = await AsyncStorage.getItem(BONUS_DATE_KEY);
      if (lastDate === today) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase.from('profiles').select('credits, last_daily_bonus').eq('id', user.id).single();
      if (profile?.last_daily_bonus === today) {
        await AsyncStorage.setItem(BONUS_DATE_KEY, today);
        return false;
      }

      const newTotal = (profile?.credits || 0) + DAILY_BONUS_AMOUNT;
      const { error } = await supabase.from('profiles').update({ credits: newTotal, last_daily_bonus: today }).eq('id', user.id);

      if (!error) {
        await AsyncStorage.setItem(BONUS_DATE_KEY, today);
        setCredits(newTotal);
        return true;
      }
    } catch (e) { console.error("Bonus error:", e); }
    return false;
  };

  // 4. Покупка (Поддержка и подписок, и пакетов энергии)
  const buyPremium = async (packageId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const offerings = await Purchases.getOfferings();      
      // Ищем пакет во всех offerings (current и default)
      const pkg = offerings.current?.availablePackages.find(p => p.product.identifier === packageId) || 
                  offerings.all['default']?.availablePackages.find(p => p.product.identifier === packageId);
                  
      if (!pkg) {
         console.error("Package not found:", packageId);
         return false;
      }
      
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // А. Если это подписка (Pro Access)
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        setIsPremium(true);
        await analytics().logEvent('subscription_started', { package_id: packageId });
      } 
      
      // Б. Если это пакет энергий (Consumable)
      const energyAmount = ENERGY_VALUES[packageId];
      if (energyAmount) {
         const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
         const newTotal = (profile?.credits || 0) + energyAmount;
         
         // Начисляем кредиты в базу
         await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);
         setCredits(newTotal);
         
         await analytics().logEvent('energy_purchased', { amount: energyAmount, package: packageId });
      }

      return true;
    } catch (e: any) { 
      if (e.userCancelled) {
        await analytics().logEvent('purchase_cancelled', { package_id: packageId });
      } else {
        await analytics().logEvent('purchase_error', { message: e.message });
      }
      return false;
    } finally { setLoading(false); }
  };

  // 5. Восстановление покупок
  const restorePurchases = async () => {
      setLoading(true);
      try {
          const info = await Purchases.restorePurchases();
          checkPremiumStatus(info);
          if (typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
              return true;
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
      return false;
  };

  // 6. Списание энергии
  const spendEnergy = useCallback(async (amount: number): Promise<boolean> => {
    if (isPremium) return true; // Бесплатно для премиум

    if (credits < amount) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newTotal = credits - amount;
      const { error } = await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);
      if (error) return false;

      setCredits(newTotal);
      await analytics().logEvent('energy_spent', { amount, remaining: newTotal });
      return true;
    } catch (e) { console.error(e); return false; }
  }, [credits, isPremium]);

  // 7. Бесплатная энергия (Реклама)
  const addFreeEnergy = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: p } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      const currentCredits = p?.credits || 0;
      const nt = currentCredits + 1;
      
      await supabase.from('profiles').update({ credits: nt }).eq('id', user.id);
      setCredits(nt);
      await analytics().logEvent('ad_reward_completed', { balance: nt });
    } catch (e) { console.error(e); } finally {
      setTimeout(() => { isProcessing.current = false; }, 3000);
    }
  }, []);

  return { 
    credits, 
    loading, 
    buyPremium, 
    addFreeEnergy, 
    spendEnergy, 
    checkDailyBonus, 
    restorePurchases, 
    refreshStatus: fetchStatus, 
    isPremium 
  };
};