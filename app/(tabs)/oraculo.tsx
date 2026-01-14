import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getOracleAnswer } from '../../src/services/openai';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Компонент мерцающей звезды
const TwinklingStar = ({ index }: { index: number }) => {
  const opacity = useRef(new Animated.Value(Math.random() * 0.8 + 0.1)).current;
  
  React.useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.random() * 0.8 + 0.1,
          duration: Math.random() * 2000 + 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: Math.random() * 0.3 + 0.05,
          duration: Math.random() * 2000 + 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    twinkle.start();
    
    return () => twinkle.stop();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity,
          transform: [{ scale: Math.random() * 1.5 + 0.3 }],
        }
      ]}
    />
  );
};

export default function OracleScreen() {
  const router = useRouter();
  const { isPremium, credits, refreshStatus } = useMonetization();
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Анимации для сферы
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const continuousPulse = useRef(new Animated.Value(1)).current;
  const glowIntensity = useRef(new Animated.Value(0.4)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const hintTextOpacity = useRef(new Animated.Value(0)).current;

  // Запускаем постоянную пульсацию сферы с дыханием
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(continuousPulse, {
          toValue: 1.08,  // Увеличил амплитуду с 1.05 до 1.08
          duration: 2500,  // Ускорил с 3000 до 2500
          useNativeDriver: true,
        }),
        Animated.timing(continuousPulse, {
          toValue: 0.92,  // Уменьшил с 0.95 до 0.92
          duration: 2500,  // Ускорил с 3000 до 2500
          useNativeDriver: true,
        }),
      ])
    );
    
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowIntensity, {
          toValue: 0.9,  // Увеличил максимальное свечение с 0.8 до 0.9
          duration: 2500,  // Синхронизировал с пульсацией
          useNativeDriver: true,
        }),
        Animated.timing(glowIntensity, {
          toValue: 0.3,  // Уменьшил минимальное свечение с 0.4 до 0.3
          duration: 2500,  // Синхронизировал с пульсацией
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    glow.start();
    
    // Анимация появления текста подсказки с задержкой
    setTimeout(() => {
      Animated.timing(hintTextOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 500);
    
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  // 🔄 СИНХРОНИЗАЦИЯ ПРИ ФОКУСЕ НА ВКЛАДКУ
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
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
    // Если идет загрузка - игнорируем нажатие
    if (isLoading) return;

    // Если Premium - сразу запускаем анимацию и запрос
    if (isPremium) {
      await executeOracle();
      return;
    }

    // Для бесплатных пользователей проверяем кредиты
    if (credits < 1) {
      Alert.alert(
        "Оракул устал",
        "Нужна энергия для связи с космосом. Посмотри рекламу или купи энергию в магазине.",
        [
          { text: "Отмена", style: "cancel" },
          { text: "Купить энергию", onPress: () => router.push('/energy') }
        ]
      );
      return;
    }

    // Списываем 1 кредит
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCredits = credits - 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) {
        console.error('Error decreasing credits:', error);
        Alert.alert('Ошибка', 'Не удалось списать энергию');
        return;
      }

      // Обновляем статус и запускаем Оракула
      await refreshStatus();
      await executeOracle();
      
    } catch (error) {
      console.error('Error in startOracle:', error);
      Alert.alert('Ошибка', 'Что-то пошло не так');
    }
  };

  const executeOracle = async () => {
    setIsLoading(true);
    setIsPulsing(true);
    setShowAnswer(false);
    setOracleAnswer('');

    // Вспышка при нажатии
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

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
      // Вызываем новую функцию getOracleAnswer
      const response = await getOracleAnswer();

      // Останавливаем анимации
      rapidPulse.stop();
      glowPulse.stop();
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);

      // Вибрация при получении ответа
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Показываем ответ с эффектом FadeIn
      setOracleAnswer(response);
      setShowAnswer(true);
      setIsPulsing(false);
      setIsLoading(false);
      
      // Запускаем анимацию появления
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Oracle Error:', error);
      rapidPulse.stop();
      glowPulse.stop();
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
      
      setIsPulsing(false);
      setIsLoading(false);
      setOracleAnswer("Оракул молчит. Попробуй позже.");
      setShowAnswer(true);
      
      // Запускаем анимацию появления ошибки
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  };

  const resetOracle = () => {
    setShowAnswer(false);
    setOracleAnswer('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={['#2E004E', '#1A0029', '#000000']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Звездная пыль на фоне */}
      <View style={styles.stardustContainer}>
        {[...Array(50)].map((_, i) => (
          <TwinklingStar key={i} index={i} />
        ))}
      </View>
      
      <View style={styles.content}>
        {/* ХЕДЕР */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Здравствуй, {userProfile?.display_name || 'Странник'}!</Text>
            <Text style={styles.zodiacText}>{userProfile?.zodiac_sign || 'Таинственный знак'}</Text>
          </View>
          
          {/* КЛИКАБЕЛЬНЫЙ БЕЙДЖ ЭНЕРГИИ */}
          <TouchableOpacity 
            onPress={() => router.push('/energy')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,215,0,0.3)',
              marginTop: -20
            }}
          >
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
              {isPremium ? '∞' : credits}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ТЕКСТОВАЯ ПОДСКАЗКА */}
        {!showAnswer && (
          <Animated.View style={[styles.hintContainer, { opacity: hintTextOpacity }]}>
            <Text style={styles.hintText}>Сконцентрируйся на своем вопросе...</Text>
          </Animated.View>
        )}

        {/* СФЕРА СУДЬБЫ */}
        <View style={styles.oracleContainer}>
          {!showAnswer ? (
            <TouchableOpacity 
              style={styles.sphereContainer} 
              onPress={startOracle}
              disabled={isPulsing}
              activeOpacity={0.8}
            >
              {/* Внешнее свечение */}
              <Animated.View 
                style={[
                  styles.outerGlow,
                  {
                    opacity: isPulsing ? glowAnim : glowIntensity,
                    transform: [{ scale: isPulsing ? pulseAnim : continuousPulse }],
                  }
                ]}
              />
              
              {/* Основная сфера */}
              <Animated.View 
                style={[
                  styles.sphere,
                  {
                    transform: [
                      { scale: isPulsing ? pulseAnim : continuousPulse },
                      { scale: flashAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      })}
                    ],
                  }
                ]}
              >
                <LinearGradient
                  colors={['#9333EA', '#7C3AED', '#6D28D9', '#4C1D95']}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={styles.sphereGradient}
                >
                  {isPulsing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <View style={styles.sphereContent}>
                      <Ionicons name="planet-outline" size={50} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.sphereText}>ПРИКОСНИСЬ К СУДЬБЕ</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          ) : (
            <View style={styles.answerContainer}>
              <View style={styles.answerSphere}>
                <Ionicons name="sparkles" size={40} color="#ffd700" />
              </View>
              <Animated.View style={[styles.answerBox, { opacity: fadeAnim }]}>
                <Text style={styles.answerText}>{oracleAnswer}</Text>
              </Animated.View>
              <TouchableOpacity style={styles.resetButton} onPress={resetOracle}>
                <Ionicons name="refresh-outline" size={20} color="#ffd700" />
                <Text style={styles.resetText}>Новый вопрос</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Звездная пыль
  stardustContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  
  content: { 
    flex: 1, 
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  // ХЕДЕР
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(147, 51, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  zodiacText: {
    fontSize: 18,
    color: '#ffd700',
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.9,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  energyText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // ТЕКСТОВАЯ ПОДСКАЗКА
  hintContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ОРАКУЛ
  oracleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Внешнее свечение
  outerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    shadowColor: '#9333EA',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 30,
  },
  
  sphere: {
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowColor: '#9333EA',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  sphereGradient: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(147, 51, 234, 0.4)',
  },
  sphereContent: {
    alignItems: 'center',
  },
  sphereText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  answerBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    marginBottom: 20,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {
    color: '#ffd700',
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  resetText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
