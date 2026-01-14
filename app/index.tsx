import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MysticButton } from '../src/components/ui/MysticButton';
import { MysticInput } from '../src/components/ui/MysticInput';
import { supabase } from '../src/services/supabase';
import MagicAlert from '../src/components/MagicAlert';

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'intro' | 'input' | 'animation';

// БОНУСНАЯ СИСТЕМА
const handleBonusSystem = async (userId: string, showAlert: (config: any) => void) => {
  try {
    const hasLaunchedApp = await AsyncStorage.getItem('has_launched_app');
    const lastBonusDate = await AsyncStorage.getItem('last_bonus_date');
    const today = new Date().toISOString().split('T')[0]; // ГГГГ-ММ-ДД

    // Проверяем, есть ли функция обновления статуса
    // Если нет, создаем простую версию
    const refreshStatus = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();
        
        if (data) {
          // Сохраняем обновленные кредиты в AsyncStorage
          await AsyncStorage.setItem('user_credits', data.credits.toString());
        }
      } catch (error) {
        console.error('Error refreshing status:', error);
      }
    };

    // ПРИВЕТСТВЕННЫЙ БОНУС (первый запуск)
    if (!hasLaunchedApp) {
      const { error } = await supabase.rpc('give_credits', { 
        user_id: userId, 
        amount: 3 
      });
      
      if (!error) {
        await AsyncStorage.setItem('has_launched_app', 'true');
        await AsyncStorage.setItem('last_bonus_date', today);
        await refreshStatus();
        
        showAlert({
          visible: true,
          title: "Подарок Звезд! ✨",
          message: "Держи 3 энергии для старта. Добро пожаловать в мир снов!",
          icon: "star",
          onConfirm: () => {}
        });
      } else {
        console.error('Welcome bonus error:', error);
      }
    }
    // ЕЖЕДНЕВНЫЙ БОНУС (не первый запуск)
    else if (lastBonusDate !== today) {
      const { error } = await supabase.rpc('give_credits', { 
        user_id: userId, 
        amount: 1 
      });
      
      if (!error) {
        await AsyncStorage.setItem('last_bonus_date', today);
        await refreshStatus();
        
        showAlert({
          visible: true,
          title: "Ежедневный дар ✨",
          message: "+1 энергия за возвращение. Продолжай исследовать свои сны!",
          icon: "sparkles",
          onConfirm: () => {}
        });
      } else {
        console.error('Daily bonus error:', error);
      }
    }
  } catch (error) {
    console.error('Bonus system error:', error);
  }
};

export default function Index() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState({ name: '', birthDate: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    icon: 'gift', 
    onConfirm: () => {} 
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Zodiac calculation helper
  const getZodiacSign = (day: number, month: number): string => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Телец';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Близнецы';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Рак';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Лев';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Дева';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Весы';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Скорпион';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Стрелец';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Козерог';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Водолей';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Рыбы';
    return 'Неизвестно';
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (step === 'animation') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      const timer = setTimeout(() => {
        router.replace('/(tabs)/suenos');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleDateChange = (text: string) => {
    // Handle deletion
    if (text.length < birthDate.length) {
      setBirthDate(text);
      return;
    }

    // Handle typing with masking
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    }

    if (formatted.length <= 10) {
      setBirthDate(formatted);
      setErrors({ ...errors, birthDate: '' });
    }
  };

  const validateInputs = () => {
    const newErrors = { name: '', birthDate: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Пожалуйста, введите ваше имя';
      isValid = false;
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = 'Пожалуйста, введите дату рождения';
      isValid = false;
    } else {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(birthDate)) {
        newErrors.birthDate = 'Формат: ДД/ММ/ГГГГ';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = async () => {
    if (step === 'intro') {
      setStep('input');
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (step === 'input') {
      if (validateInputs()) {
        setIsLoading(true);
        
        try {
          // Sign in anonymously
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          
          if (authError) throw authError;
          if (!authData.session) throw new Error('No session created');

          // Calculate zodiac sign
          const parts = birthDate.split('/');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const zodiacSign = getZodiacSign(day, month);

          // Upsert to profiles table
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.session.user.id,
            display_name: name,
            birth_date: birthDate,
            zodiac_sign: zodiacSign,
            updated_at: new Date().toISOString(),
          });

          if (profileError) throw profileError;

          // Save zodiac sign to AsyncStorage for chat screen
          await AsyncStorage.setItem('user_zodiac', zodiacSign);

          // БОНУСНАЯ СИСТЕМА - ПРИВЕТСТВЕННЫЙ И ЕЖЕДНЕВНЫЙ БОНУСЫ
          await handleBonusSystem(authData.session.user.id, setAlertConfig);

          // Success - proceed to animation
          setStep('animation');
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();

        } catch (error: any) {
          console.error('Registration error:', error);
          Alert.alert('Ошибка', 'Не удалось зарегистрироваться. Попробуйте еще раз.');
          setIsLoading(false);
        }
      }
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0b2e', '#120d26', '#0a0612']}
        style={styles.gradient}
      />
      <StatusBar style="light" />

      {step === 'intro' && (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.introContainer}>
            <Text style={styles.lunaIcon}>🌙</Text>
            <Text style={styles.title}>Добро пожаловать в Luna</Text>
            <Text style={styles.lunaName}>Луна</Text>
            <Text style={styles.subtitle}>
              Я - энергия, которая интерпретирует сигналы вселенной для тебя.
            </Text>
            <Text style={styles.description}>
              Позволь мне провести тебя через загадочный мир твоих снов и раскрыть скрытые сообщения, которые космос имеет для тебя.
            </Text>
          </View>
          <MysticButton
            title="Начать"
            onPress={handleContinue}
            style={styles.button}
          />
        </Animated.View>
      )}

      {step === 'input' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.inputTitle}>Расскажи о себе</Text>
                <Text style={styles.inputSubtitle}>
                  Чтобы персонализировать твой космический опыт
                </Text>

                <MysticInput
                  label="Имя"
                  placeholder="Как тебя зовут?"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setErrors({ ...errors, name: '' });
                  }}
                  error={errors.name}
                  autoCapitalize="words"
                  containerStyle={styles.input}
                />

                <MysticInput
                  label="Дата рождения"
                  placeholder="ДД/ММ/ГГГГ"
                  value={birthDate}
                  onChangeText={handleDateChange}
                  error={errors.birthDate}
                  keyboardType="numeric"
                  maxLength={10}
                  containerStyle={styles.input}
                />

                <Text style={styles.zodiacNote}>
                  ✨ Твоя дата рождения поможет мне соединиться с твоей астральной энергией
                </Text>
              </View>

              <MysticButton
                title="Продолжить"
                onPress={handleContinue}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'animation' && (
        <Animated.View
          style={[
            styles.animationContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.cosmicCircle,
              {
                transform: [{ scale: pulseAnim }, { rotate: spin }],
              },
            ]}
          >
            <View style={styles.innerCircle}>
              <Text style={styles.cosmicIcon}>✨</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.animationText}>Анализирую твою звездную карту...</Text>
            <Text style={styles.animationSubtext}>Соединяюсь со звездами...</Text>
            <Text style={styles.animationSubtext}>Подготавливаю мистический опыт...</Text>
          </Animated.View>
        </Animated.View>
      )}
      
      {/* MagicAlert для бонусов */}
      <MagicAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        onConfirm={() => {
          alertConfig.onConfirm();
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }}
        confirmText="Принять"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  introContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  lunaIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  lunaName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginTop: 20,
  },
  inputTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
  },
  input: {
    marginBottom: 24,
  },
  zodiacNote: {
    fontSize: 14,
    color: '#C4B5FD',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cosmicCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  cosmicIcon: {
    fontSize: 60,
  },
  animationText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  animationSubtext: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
});
