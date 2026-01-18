import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import MagicAlert from './MagicAlert';

// Добавляем интерфейс для props
interface WatchAdButtonProps {
  onReward?: () => void; // Функция, которую вызовем после успеха
}

export default function WatchAdButton({ onReward }: WatchAdButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    icon: 'sparkles' 
  });

  const handleEarnReward = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setAlertConfig(prev => ({ ...prev, visible: false }));

      // 1. Читаем баланс
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + 1;

      // 2. Обновляем базу
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;

      // 3. ВАЖНО: Сообщаем родителю (Магазину), что пора обновиться
      if (onReward) {
        onReward(); 
      }
      
      // 4. Показываем успех
      setAlertConfig({
        visible: true,
        title: "¡Energía Recibida!",
        message: "+1 Energía del universo.",
        icon: "star"
      });

    } catch (e) {
      console.error(e);
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "No se pudo conectar.",
        icon: "alert-circle"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showAd = () => {
    if (isLoading) return;
    setIsLoading(true);
    
    setAlertConfig({
      visible: true,
      title: "Viendo Visión...",
      message: "Conectando con el cosmos... (3s)",
      icon: "eye"
    });

    setTimeout(() => {
      handleEarnReward();
    }, 3000); 
  };

  return (
    <>
      <TouchableOpacity onPress={showAd} activeOpacity={0.8} style={styles.container}>
        <LinearGradient
          colors={['#8E2DE2', '#4A00E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {isLoading ? (
             <ActivityIndicator color="#FFF" size="small" />
          ) : (
             <Ionicons name="play-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.buttonText}>
            {isLoading ? " Cargando..." : "Ver Video (+1 ✨)"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <MagicAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText="Gracias"
        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 25,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});