import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MysticButton } from '../src/components/ui/MysticButton';
import { MysticInput } from '../src/components/ui/MysticInput';
import { supabase } from '../src/services/supabase';

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'intro' | 'input' | 'animation';

const getZodiacSign = (day: number, month: number): string => {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Tauro';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Géminis';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cáncer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitario';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricornio';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Acuario';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Piscis';
  return '';
};

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [detectedZodiac, setDetectedZodiac] = useState('');
  const [errors, setErrors] = useState({ name: '', birthDate: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (step === 'animation') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();

      const timer = setTimeout(() => {
        // ИСПРАВЛЕНО: Переход на СНЫ (suenos) с параметром welcome
        router.replace({ pathname: '/(tabs)/suenos', params: { welcome: 'true' } });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleDateChange = (text: string) => {
    if (text.length < birthDate.length) { setBirthDate(text); setDetectedZodiac(''); return; }
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    if (formatted.length <= 10) { 
      setBirthDate(formatted); setErrors({ ...errors, birthDate: '' }); 
      if (cleaned.length >= 4) {
        const sign = getZodiacSign(parseInt(cleaned.slice(0, 2)), parseInt(cleaned.slice(2, 4)));
        if (sign) setDetectedZodiac(sign);
      }
    }
  };

  const handleContinue = async () => {
    if (step === 'intro') {
      setStep('input');
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else if (step === 'input') {
      if (!name.trim()) { setErrors({...errors, name: 'Requerido'}); return; }
      if (!birthDate.trim()) { setErrors({...errors, birthDate: 'Requerido'}); return; }
      
      setIsLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;

        const zodiacSign = detectedZodiac || 'Desconocido';

        // 1. Запись в БД
        await supabase.from('profiles').upsert({
          id: authData.session?.user.id,
          display_name: name,
          birth_date: birthDate,
          zodiac_sign: zodiacSign,
          credits: 3, 
          updated_at: new Date().toISOString(),
        });

        // 2. ВАЖНО: Запись в память (Мгновенный доступ)
        await AsyncStorage.setItem('user_name', name);
        await AsyncStorage.setItem('user_zodiac', zodiacSign);
        await AsyncStorage.setItem('user_credits', '3');
        await AsyncStorage.setItem('has_launched_app', 'true');

        setStep('animation');
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      } catch (error) {
        Alert.alert('Error', 'Error de conexión');
        setIsLoading(false);
      }
    }
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <LinearGradient colors={['#1a0b2e', '#120d26', '#0a0612']} style={styles.gradient} />
      <StatusBar style="light" />

      {step === 'intro' && (
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.introContainer}>
            <Text style={styles.lunaIcon}>🌙</Text>
            <Text style={styles.title}>Bienvenido a Luna</Text>
            <Text style={styles.lunaName}>Luna</Text>
            <Text style={styles.subtitle}>Soy la energía que interpreta las señales del universo.</Text>
          </View>
          <MysticButton title="Comenzar" onPress={handleContinue} style={styles.button} />
        </Animated.View>
      )}

      {step === 'input' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
               <View style={{flex: 1, paddingHorizontal: 24, justifyContent: 'center'}}>
                  <View style={styles.inputsContainer}>
                      <Text style={styles.inputTitle}>Cuéntame sobre ti</Text>
                      <MysticInput label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} error={errors.name} />
                      <View style={{height: 20}}/>
                      <MysticInput label="Fecha de nacimiento" placeholder="DD/MM/AAAA" value={birthDate} onChangeText={handleDateChange} error={errors.birthDate} keyboardType="numeric" maxLength={10} />
                      {detectedZodiac ? <Text style={styles.zodiacText}>Tu signo: <Text style={{color:'#FFD700', fontWeight:'bold'}}>{detectedZodiac}</Text></Text> : null}
                  </View>
                  <MysticButton title="Continuar" onPress={handleContinue} loading={isLoading} style={{marginTop: 40}} />
               </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'animation' && (
        <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.cosmicCircle, { transform: [{ scale: pulseAnim }, { rotate: spin }] }]}>
            <View style={styles.innerCircle}><Text style={styles.cosmicIcon}>✨</Text></View>
          </Animated.View>
          <Text style={styles.animationText}>Conectando con las estrellas...</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  introContainer: { alignItems: 'center', marginBottom: 60 },
  lunaIcon: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC', textAlign: 'center' },
  lunaName: { fontSize: 24, color: '#A855F7', marginBottom: 20 },
  subtitle: { fontSize: 18, color: '#E2E8F0', textAlign: 'center' },
  inputsContainer: { width: '100%' },
  inputTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' },
  zodiacText: { color: '#E2E8F0', textAlign: 'center', marginTop: 15, fontSize: 18 },
  button: { marginTop: 20 },
  animationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cosmicCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  innerCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
  cosmicIcon: { fontSize: 60 },
  animationText: { fontSize: 24, color: '#A855F7' },
});