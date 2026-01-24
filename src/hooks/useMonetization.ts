import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Facebook удален 🗑️
import analytics from '@react-native-firebase/analytics';

const ENERGY_VALUES: Record<string, number> = {
  'energy_10_v2': 10,
  'energy_50_v2': 50,
  'energy_150_v2': 150,
};

const BONUS_DATE_KEY = 'daily_bonus_date_v1';
const DAILY_BONUS_AMOUNT = 1;

export const useMonetization = () => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const isProcessing = useRef(false);

  // 1. Получение баланса
  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).maybeSingle();
      if (data) setCredits(data.credits || 0);
    } catch (e) { console.error('Fetch error:', e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // 2. Ежедневный бонус (+1 энергия)
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

  // 3. Покупка энергии
  const buyPremium = async (packageId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const offerings = await Purchases.getOfferings();      
      const pkg = offerings.current?.availablePackages.find(p => p.product.identifier === packageId);
      if (!pkg) return false;
      
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const price = pkg.product.price;
      const currency = pkg.product.currencyCode;

      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      const newTotal = (profile?.credits || 0) + (ENERGY_VALUES[packageId] || 0);
      await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);
      setCredits(newTotal);

      // Аналитика успеха (Только Firebase)
      await analytics().logPurchase({
        value: price, currency,
        items: [{ item_id: packageId, item_name: `Pack ${ENERGY_VALUES[packageId]}`, quantity: 1 }]
      });

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

  // 4. Списание энергии (для Оракула и Снов)
  const spendEnergy = useCallback(async (amount: number): Promise<boolean> => {
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
  }, [credits]);

  // 5. Бесплатная энергия (Реклама)
  const addFreeEnergy = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      const nt = (p?.credits || 0) + 1;
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
    refreshStatus: fetchStatus, 
    isPremium: false 
  };
};