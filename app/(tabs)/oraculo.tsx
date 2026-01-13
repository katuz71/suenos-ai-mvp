import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { interpretDream } from '../../src/services/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';

export default function OracleScreen() {
  const router = useRouter();
  const { consumeCredit, credits, refreshStatus } = useMonetization();
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Анимации для сферы
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // 🔄 СИНХРОНИЗАЦИЯ ПРИ ФОКУСЕ НА ВКЛАДКУ
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        console.log("🔮 [FOCUS] Синхронизация статуса во вкладке Оракул");
        await refreshStatus();
        await fetchProfile();
      };
      refresh();
    }, [refreshStatus])
  );

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, zodiac_sign')
          .eq('id', user.id)
          .single();

        setUserProfile(data);
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const startOracle = async () => {
    // Проверяем кредиты
    const hasAccess = await consumeCredit();
    if (!hasAccess) {
      router.push('/energy');
      return;
    }

    setIsPulsing(true);
    setShowAnswer(false);
    setOracleAnswer('');

    // Запускаем интенсивную пульсацию
    const rapidPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    rapidPulse.start();
    glowPulse.start();

    // Получаем ответ от оракула
    try {
      // Получаем знак зодиака
      const zodiacFromProfile = userProfile?.zodiac_sign;
      const zodiacFromStore = await AsyncStorage.getItem('user_zodiac');
      const finalZodiac = zodiacFromProfile || zodiacFromStore;

      // Вызываем ИИ в режиме оракула
      const response = await interpretDream("Дай совет", {
        mode: 'oracle',
        userContext: {
          zodiac: finalZodiac || undefined,
          name: userProfile?.display_name || undefined,
        }
      });

      // Останавливаем анимации
      rapidPulse.stop();
      glowPulse.stop();
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);

      // Показываем ответ
      setTimeout(() => {
        setOracleAnswer(response);
        setShowAnswer(true);
        setIsPulsing(false);
      }, 500);

    } catch (error) {
      console.error('Oracle Error:', error);
      rapidPulse.stop();
      glowPulse.stop();
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
      
      setIsPulsing(false);
      setOracleAnswer("Вселенная временно молчит. Попробуй спросить позже.");
      setShowAnswer(true);
    }
  };

  const resetOracle = () => {
    setShowAnswer(false);
    setOracleAnswer('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={['#1a1a2e', '#16213e', '#0f3460']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Сфера Судьбы</Text>
          <Text style={styles.subtitle}>
            Задай вопрос и коснись Сферы
          </Text>
        </View>

        {/* Сфера оракула */}
        <View style={styles.oracleContainer}>
          {!showAnswer ? (
            <TouchableOpacity 
              style={styles.sphereContainer} 
              onPress={startOracle}
              disabled={isPulsing}
              activeOpacity={0.8}
            >
              <Animated.View 
                style={[
                  styles.sphere,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0.2, 1],
                      outputRange: [0.9, 1],
                    }),
                  }
                ]}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6']}
                  style={styles.sphereGradient}
                >
                  {isPulsing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <View style={styles.sphereContent}>
                      <Ionicons name="eye-outline" size={50} color="#fff" />
                      <Text style={styles.sphereText}>Коснись</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          ) : (
            <View style={styles.answerContainer}>
              <View style={styles.answerSphere}>
                <Ionicons name="sparkles" size={40} color="#8B5CF6" />
              </View>
              <View style={styles.answerBox}>
                <Text style={styles.answerText}>{oracleAnswer}</Text>
              </View>
              <TouchableOpacity style={styles.resetButton} onPress={resetOracle}>
                <Ionicons name="refresh-outline" size={20} color="#8B5CF6" />
                <Text style={styles.resetText}>Новый вопрос</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Индикатор кредитов */}
        <View style={styles.creditIndicator}>
          <Text style={styles.creditText}>Кредитов: {credits}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  
  // Заголовок
  header: {
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Оракул
  oracleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphere: {
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  sphereGradient: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  sphereContent: {
    alignItems: 'center',
  },
  sphereText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Ответ
  answerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  answerSphere: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  answerBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  answerText: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  resetText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Индикатор кредитов
  creditIndicator: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  creditText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
