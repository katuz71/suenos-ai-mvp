import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppEventsLogger } from 'react-native-fbsdk-next';
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

  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).maybeSingle();
      if (data) setCredits(data.credits || 0);

    } catch (e) { 
      console.error('Error fetching status:', e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // DAILY BONUS CHECK LOGIC
  const checkDailyBonus = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = await AsyncStorage.getItem(BONUS_DATE_KEY);

      if (lastDate === today) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase.from('profiles')
        .select('credits, last_daily_bonus')
        .eq('id', user.id)
        .single();

      if (profile?.last_daily_bonus === today) {
        await AsyncStorage.setItem(BONUS_DATE_KEY, today);
        return false;
      }

      const newTotal = (profile?.credits || 0) + DAILY_BONUS_AMOUNT;

      const { error } = await supabase.from('profiles')
        .update({ credits: newTotal, last_daily_bonus: today })
        .eq('id', user.id);

      if (!error) {
        await AsyncStorage.setItem(BONUS_DATE_KEY, today);
        setCredits(newTotal);
        return true;
      }
    } catch (e) {
      console.error("Bonus error:", e);
    }
    return false;
  };

  // PURCHASE LOGIC WITH ANALYTICS
  const buyPremium = async (packageId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const offerings = await Purchases.getOfferings();      
      const packageToBuy = offerings.current?.availablePackages.find(
        p => p.product.identifier === packageId
      );
      
      if (!packageToBuy) return false;
      
      // Perform purchase through RevenueCat
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      
      // Extract price and currency for high-accuracy tracking
      const price = packageToBuy.product.price;
      const currency = packageToBuy.product.currencyCode;

      if (ENERGY_VALUES[packageId]) {
         const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
         const newTotal = (profile?.credits || 0) + ENERGY_VALUES[packageId];
         
         await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);
         setCredits(newTotal);

         // 1. META (Facebook) PURCHASE LOGGING
         AppEventsLogger.logPurchase(price, currency, {
           content_type: 'product',
           content_id: packageId,
           energy_amount: ENERGY_VALUES[packageId].toString()
         });

         // 2. FIREBASE PURCHASE LOGGING
         await analytics().logPurchase({
           value: price,
           currency: currency,
           items: [{
             item_id: packageId,
             item_name: `Pack ${ENERGY_VALUES[packageId]} Energy`,
             quantity: 1
           }]
         });

         return true;
      }
    } catch (e: any) { 
      if (!e.userCancelled) {
        console.error('Purchase error:', e);
        await analytics().logEvent('purchase_error', { 
          message: e.message,
          package: packageId 
        });
      }
    } finally { 
      setLoading(false); 
    }
    return false;
  };

  const spendEnergy = async (amount: number): Promise<boolean> => {
    try {
      if (credits < amount) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newTotal = credits - amount;
      setCredits(newTotal);

      const { error } = await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);

      if (error) {
        setCredits(credits);
        return false;
      }

      // Log energy spending event
      await analytics().logEvent('energy_spent', {
        amount: amount,
        remaining: newTotal
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const addFreeEnergy = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      const newTotal = (profile?.credits || 0) + 1;

      const { error } = await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);

      if (!error) {
        setCredits(newTotal);
        await analytics().logEvent('free_energy_claimed');
      }
    } catch (e) {
      console.error('Error adding free energy:', e);
    } finally {
      setTimeout(() => { isProcessing.current = false; }, 3000);
    }
  }, []);

  return { 
    credits, 
    isPremium: false,
    loading, 
    buyPremium, 
    addFreeEnergy, 
    spendEnergy, 
    checkDailyBonus,
    refreshStatus: fetchStatus 
  };
};