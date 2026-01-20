import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { useMonetization } from './useMonetization';

export function useRewardedAd() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshStatus } = useMonetization();

  useEffect(() => {
    // Ad loading simulation
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
      Alert.alert('¡Éxito!', 'Has recibido una recompensa estelar (+1 ✨)');
      
      setLoaded(false);
      setTimeout(() => setLoaded(true), 2000);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo procesar la recompensa.');
    } finally {
      setLoading(false);
    }
  };

  const showAd = () => {
    Alert.alert(
      "Modo de Desarrollo",
      "El video no está disponible en Expo Go. ¿Deseas recibir la recompensa ahora?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, recibir", onPress: grantReward }
      ]
    );
  };

  return { loaded, loading, showAd };
}