import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity, // <--- ВОТ ЧТО НУЖНО ДОБАВИТЬ
  ScrollView,
  Dimensions,
  StatusBar as RNStatusBar
} from 'react-native';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MysticInput } from '../../src/components/ui/MysticInput'; // Убедись, что путь верный
import { Colors } from '../../src/constants/Colors'; // Убедись, что путь верный

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'intro' | 'input' | 'animation';

// --- КОМПОНЕНТ ЗВЕЗДЫ ---
const Star = ({ delay, size, left, top }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 2000, delay: delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.star, { width: size, height: size, left, top, opacity }]} />
  );
};

// --- ХЕЛПЕР ЗОДИАКА ---
const getZodiacSign = (day: number, month: number): string => {
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Acuario";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Piscis";
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Tauro";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Géminis";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cáncer";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Escorpio";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagitario";
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricornio";
  return "";
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [detectedZodiac, setDetectedZodiac] = useState('');
  const [errors, setErrors] = useState({ name: '', birthDate: '' });
  const [loadingText, setLoadingText] = useState('Analizando tu carta astral...');

  // Анимации
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current; // Для Луны
  const glowAnim = useRef(new Animated.Value(1)).current;  // Для свечения
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Для инпутов
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Генерация звезд (один раз)
  const stars = useRef([...Array(25)].map((_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 1,
    left: Math.random() * width,
    top: Math.random() * height,
    delay: Math.random() * 2000,
  }))).current;

  useEffect(() => {
    // Старт анимации появления
    Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();

    // Парение Луны
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 3500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();

    // Пульсация свечения
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.3, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Логика перехода между шагами
  const handleContinueAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleStart = () => {
    setStep('input');
    handleContinueAnimation();
  };

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    
    if (formatted.length <= 10) {
      setBirthDate(formatted);
      setErrors({ ...errors, birthDate: '' });
      if (cleaned.length >= 4) {
        const d = parseInt(cleaned.slice(0, 2));
        const m = parseInt(cleaned.slice(2, 4));
        if (d > 0 && d <= 31 && m > 0 && m <= 12) {
          const sign = getZodiacSign(d, m);
          setDetectedZodiac(sign);
        } else setDetectedZodiac('');
      } else setDetectedZodiac('');
    }
  };

  const validateInputs = () => {
    const newErrors = { name: '', birthDate: '' };
    let isValid = true;
    if (!name.trim()) { newErrors.name = 'Requerido'; isValid = false; }
    if (!birthDate.trim()) { newErrors.birthDate = 'Requerido'; isValid = false; }
    else if (!/^(\d{2})\/(\d{2})\/(\d{4})$/.test(birthDate)) { newErrors.birthDate = 'Formato inválido'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const submitForm = () => {
    if (validateInputs()) {
      Keyboard.dismiss();
      setStep('animation');
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  };

  // Эффект для финальной анимации загрузки
  useEffect(() => {
    if (step === 'animation') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
      
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true })).start();

      const texts = ['Conectando con las estrellas...', 'Calculando tu ascendente...', 'Interpretando tu energía...', '¡Todo listo!'];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < texts.length) setLoadingText(texts[i]);
      }, 1500);

      const timer = setTimeout(() => {
        clearInterval(interval);
        router.replace({ pathname: '/(tabs)/suenos', params: { name, date: birthDate, zodiac: detectedZodiac, welcome: 'true' } });
      }, 5000);
      
      return () => { clearTimeout(timer); clearInterval(interval); };
    }
  }, [step]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. ГЛУБОКИЙ ФОН */}
      <LinearGradient
        colors={['#050212', '#1a0b2e', '#2d1b4e']}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* 2. ЗВЕЗДЫ */}
      {stars.map((star) => <Star key={star.id} {...star} />)}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" scrollEnabled={step === 'input'} showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>

              {/* ШАГ 1: INTRO (Магический) */}
              {step === 'intro' && (
                <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
                  {/* Парящая Луна */}
                  <Animated.View style={{ transform: [{ translateY: floatAnim }], marginBottom: 40, alignItems: 'center' }}>
                     <Animated.View style={[styles.moonGlow, { transform: [{ scale: glowAnim }] }]} />
                     <Ionicons name="moon" size={100} color="#FFD700" style={styles.moonIcon} />
                  </Animated.View>

                  <Text style={styles.title}>LUNA</Text>
                  <Text style={styles.subtitle}>EL ESPEJO DE TUS SUEÑOS</Text>
                  <Text style={styles.description}>
                    Soy la energía que conecta tu subconsciente con las estrellas.
                  </Text>

                  <TouchableOpacity style={styles.buttonContainer} onPress={handleStart} activeOpacity={0.8}>
                    <LinearGradient colors={['#FFD700', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>DESPERTAR</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ШАГ 2: ВВОД ДАННЫХ */}
              {step === 'input' && (
                <Animated.View style={{ width: '100%', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                  <Text style={styles.inputTitle}>Cuéntame sobre ti</Text>
                  <Text style={styles.inputSubtitle}>Para alinear tu energía</Text>

                  <View style={styles.formContainer}>
                    <MysticInput
                      label="Nombre"
                      placeholder="Tu nombre cósmico"
                      value={name}
                      onChangeText={(t) => { setName(t); setErrors({ ...errors, name: '' }); }}
                      error={errors.name}
                      autoCapitalize="words"
                      containerStyle={{ marginBottom: 20 }}
                    />
                    <MysticInput
                      label="Nacimiento"
                      placeholder="DD/MM/AAAA"
                      value={birthDate}
                      onChangeText={handleDateChange}
                      error={errors.birthDate}
                      keyboardType="numeric"
                      maxLength={10}
                      containerStyle={{ marginBottom: 20 }}
                    />
                    
                    {detectedZodiac ? (
                      <Animated.View style={styles.zodiacBadge}>
                        <Ionicons name="sparkles" size={16} color="#FFD700" />
                        <Text style={styles.zodiacText}>Signo: <Text style={{fontWeight: 'bold', color: '#FFD700'}}>{detectedZodiac}</Text></Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.zodiacNote}>✨ Tu fecha revela tu destino</Text>
                    )}
                  </View>

                  <TouchableOpacity style={styles.buttonContainer} onPress={submitForm} activeOpacity={0.8}>
                    <LinearGradient colors={['#8E2DE2', '#4A00E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>CONTINUAR</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ШАГ 3: ЗАГРУЗКА (Магическая) */}
              {step === 'animation' && (
                <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
                  <Animated.View style={[styles.cosmicCircle, { transform: [{ scale: pulseAnim }, { rotate: spin }] }]}>
                    <View style={styles.innerCircle}>
                      <Text style={{ fontSize: 40 }}>✨</Text>
                    </View>
                  </Animated.View>
                  <Text style={styles.animationText}>{loadingText}</Text>
                  {detectedZodiac && <Text style={styles.animationSubtext}>Conectando con {detectedZodiac}...</Text>}
                </Animated.View>
              )}

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050212' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  star: { position: 'absolute', backgroundColor: '#fff', borderRadius: 50 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  centerContent: { alignItems: 'center', width: '100%' },

  // STYLES FOR INTRO
  moonGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: "#FFD700", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30,
  },
  moonIcon: {
    shadowColor: "#FFD700", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20,
  },
  title: {
    fontSize: 56, fontWeight: '200', color: '#fff', letterSpacing: 8, marginBottom: 5,
    fontVariant: ['small-caps'], textAlign: 'center'
  },
  subtitle: {
    fontSize: 14, color: '#FFD700', fontWeight: '600', letterSpacing: 3, marginBottom: 20,
    textTransform: 'uppercase', textAlign: 'center'
  },
  description: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 50,
  },
  buttonContainer: {
    width: '100%', shadowColor: "#FFD700", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 10
  },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase',
  },

  // STYLES FOR INPUT
  inputTitle: { fontSize: 32, fontWeight: '300', color: '#fff', marginBottom: 5, letterSpacing: 1 },
  inputSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 30 },
  formContainer: { width: '100%', marginBottom: 30 },
  zodiacBadge: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 12, borderRadius: 16, 
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', marginTop: 10 
  },
  zodiacText: { color: '#fff', fontSize: 16 },
  zodiacNote: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 15, fontStyle: 'italic' },

  // STYLES FOR ANIMATION
  cosmicCircle: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#FFD700',
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
    shadowColor: "#FFD700", shadowOpacity: 0.5, shadowRadius: 20
  },
  innerCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(107, 70, 193, 0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  animationText: { fontSize: 20, color: '#FFD700', fontWeight: '600', letterSpacing: 1, marginBottom: 10 },
  animationSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});