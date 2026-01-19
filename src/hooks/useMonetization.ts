import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import Purchases from 'react-native-purchases';

const MOCK_PAYMENT = false; 

const ENERGY_VALUES: Record<string, number> = {
  'energy_10_v2': 10,
  'energy_50_v2': 50,
  'energy_150_v2': 150,
};

export const useMonetization = () => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setCredits(data.credits || 0);
      }
    } catch (e) {
      console.error('Error fetching status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const buyPremium = async (packageId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const offerings = await Purchases.getOfferings();
      const packageToBuy = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === packageId
      );

      if (!packageToBuy) return false;

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      // Проверяем факт покупки через RevenueCat
      if (typeof customerInfo.entitlements.active['energy_access'] !== "undefined") {
        const energyToAdd = ENERGY_VALUES[packageId] || 0;
        
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        const newTotal = (profile?.credits || 0) + energyToAdd;

        // ВАЖНО: Убрано is_premium: true. Обновляем ТОЛЬКО количество кредитов.
        await supabase.from('profiles').update({ 
          credits: newTotal
        }).eq('id', user.id);

        setCredits(newTotal);
        return true;
      }
    } catch (e) {
      console.error('Purchase error:', e);
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Исправленное списание: больше никакого "бесконечного" премиума
  const consumeCredit = async (): Promise<boolean> => {
    if (credits > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', user.id);
      
      if (!error) {
        setCredits(prev => prev - 1);
        return true;
      }
    }
    return false;
  };

  return { 
    credits, 
    loading, 
    buyPremium, 
    consumeCredit, 
    refreshStatus: fetchStatus 
  };
};