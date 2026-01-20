import { useEffect, useState, useCallback, useRef } from 'react';      
import { supabase } from '../services/supabase'; // Проверь путь
import Purchases from 'react-native-purchases';

const ENERGY_VALUES: Record<string, number> = {
  'energy_10_v2': 10,
  'energy_50_v2': 50,
  'energy_150_v2': 150,
};

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
    } catch (e) { console.error('Error fetching status:', e); }        
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // --- ПОКУПКА ---
  const buyPremium = async (packageId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();        
      if (!user) return false;
      const offerings = await Purchases.getOfferings();
      const packageToBuy = offerings.current?.availablePackages.find(p => p.product.identifier === packageId);
      if (!packageToBuy) return false;
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      if (typeof customerInfo.entitlements.active['energy_access'] !== "undefined") {
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        const newTotal = (profile?.credits || 0) + (ENERGY_VALUES[packageId] || 0);
        await supabase.from('profiles').update({ credits: newTotal }).eq('id', user.id);
        setCredits(newTotal);
        return true;
      }
    } catch (e) { console.error('Purchase error:', e); }
    finally { setLoading(false); }
    return false;
  };

  // --- СПИСАНИЕ ЭНЕРГИИ (Для Главного Экрана) ---
  const spendEnergy = async (amount: number): Promise<boolean> => {
    try {
      if (credits < amount) return false; // Не хватает

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newTotal = credits - amount;
      
      // Сначала оптимистично обновляем UI
      setCredits(newTotal);

      // Потом базу
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newTotal })
        .eq('id', user.id);

      if (error) {
        // Если ошибка - возвращаем как было
        setCredits(credits); 
        console.error("Ошибка списания:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // --- НАЧИСЛЕНИЕ БЕСПЛАТНОЙ ---
  const addFreeEnergy = useCallback(async () => {
    console.log("➡️ [HOOK] Запуск addFreeEnergy...");        
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
        console.log("✅ [HOOK] +1 Энергия начислена");
      }
    } catch (e) {
      console.error('❌ [HOOK] Ошибка:', e);
    } finally {
      setTimeout(() => { isProcessing.current = false; }, 3000);
    }
  }, []);

  return { credits, loading, buyPremium, addFreeEnergy, spendEnergy, refreshStatus: fetchStatus };
};