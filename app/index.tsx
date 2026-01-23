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
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MysticInput } from '../src/components/ui/MysticInput';
import { supabase } from '../src/services/supabase';

// --- ИМПОРТЫ АНАЛИТИКИ ---
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';

// --- ИМПОРТЫ РЕКЛАМЫ И СОГЛАСИЯ ---
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';

const { width, height } = Dimensions.get('window');

// Цветовая палитра
const THEME = {
  bg: '#090C15', 
  gold: '#D4AF37', 
  goldDim: '#8A7120',
  violet: '#3B005D', 
  text: '#F0F0F0',
  fontSerif: Platform.select({ ios: 'Georgia', android: 'serif' }),
};

type OnboardingStep = 'intro' | 'input' | 'animation';

// --- ЗВЕЗДА ---
const Star = ({ delay, size, left, top }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 2500, delay: delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.star, { width: size, height: size, left, top, opacity }]} />
  );
};

// --- РАЗДЕЛИТЕЛЬ ---
const MysticDivider = () => (
  <View style={styles.dividerContainer}>
    <View style={styles.dividerLine} />
    <View style={styles.dividerIconContainer}>
       <Ionicons name="sunny-outline" size={16} color={THEME.gold} />
    </View>
    <View style={styles.dividerLine} />
  </View>
);

// --- ХЕЛПЕР ЗОДИАКА ---
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
  const [loadingText, setLoadingText] = useState('Conectando con las estrellas...');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current; 
  const glowAnim = useRef(new Animated.Value(1)).current; 
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const stars = useRef([...Array(30)].map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    left: Math.random() * width,
    top: Math.random() * height,
    delay: Math.random() * 3000,
  }))).current;

  // --- ИНИЦИАЛИЗАЦИЯ GDPR И ADMOB (ИСПРАВЛЕНО) ---
  useEffect(() => {
    const initAds = async () => {
      try {
        console.log("Ads: Checking consent...");
        // Мы НЕ используем await здесь для всей функции, чтобы не вешать поток
        AdsConsent.requestInfoUpdate().then(async (consentInfo) => {
          console.log("Ads: Consent status", consentInfo.status);
          
          if (consentInfo.isConsentFormAvailable && 
              consentInfo.status === AdsConsentStatus.REQUIRED) {
            await AdsConsent.showForm();
          }
          
          await mobileAds().initialize();
          console.log("Ads: Initialized ✅");
        }).catch(e => {
          console.log("Ads: Consent error", e);
          mobileAds().initialize(); // Все равно запускаем рекламу
        });
      } catch (e) {
        mobileAds().initialize();
      }
    };

    initAds();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.2, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (step === 'animation') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])).start();

      const texts = ['Leyendo tu energía...', 'Alineando los astros...', 'Descifrando el destino...', '¡Bienvenido!'];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < texts.length) setLoadingText(texts[i]);
      }, 1500);

      const timer = setTimeout(() => {
        clearInterval(interval);
        router.replace({ pathname: '/(tabs)/suenos', params: { welcome: 'true' } });
      }, 5000);

      return () => { clearTimeout(timer); clearInterval(interval); };
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
    console.log("Button pressed, current step:", step);
    if (step === 'intro') {
      setStep('input');
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    } else if (step === 'input') {
      if (!name.trim()) { setErrors({...errors, name: 'Requerido'}); return; }
      if (!birthDate.trim()) { setErrors({...errors, birthDate: 'Requerido'}); return; }
      
      setIsLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;

        const zodiacSign = detectedZodiac || 'Desconocido';
        const today = new Date().toISOString().split('T')[0];

        await supabase.from('profiles').upsert({
          id: authData.session?.user.id,
          display_name: name,
          birth_date: birthDate,
          zodiac_sign: zodiacSign,
          credits: 3, 
          last_daily_bonus: today,
          updated_at: new Date().toISOString(),
        });

        await AsyncStorage.setItem('user_name', name);
        await AsyncStorage.setItem('user_zodiac', zodiacSign);
        await AsyncStorage.setItem('daily_bonus_date_v1', today);
        await AsyncStorage.setItem('has_launched_app', 'true');

        // --- TRACKING EVENTS (Регистрация) ---
        try {
            // 1. Firebase Analytics
            await analytics().logSignUp({ method: 'anonymous' });

            // 2. Facebook (Meta) SDK
            AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
                [AppEventsLogger.AppEventParams.RegistrationMethod]: 'anonymous'
            });
            console.log("Events tracked: SignUp (Firebase) & CompletedRegistration (FB)");
        } catch (e) {
            console.log("Error tracking events:", e);
        }
        // -------------------------------------

        setStep('animation');
      } catch (error) {
        Alert.alert('Error', 'Error de conexión');
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.backgroundFill} />
      {stars.map((star) => <Star key={star.id} {...star} />)}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
             
             <View style={[styles.content, { paddingBottom: insets.bottom + 20, paddingTop: insets.top + 60 }]}>
                
                {/* --- INTRO --- */}
                {step === 'intro' && (
                  <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
                    <Text style={styles.topHeader}>CONEXIÓN INTERIOR</Text>
                    <MysticDivider />
                    <Text style={styles.serifSubtitle}>Explora el significado de tus{'\n'}sueños cada día</Text>

                    <View style={{ height: 60 }} />

                    <Animated.View style={[styles.moonContainer, { transform: [{ translateY: floatAnim }] }]}>
                       <Animated.View style={[styles.goldGlow, { transform: [{ scale: glowAnim }] }]} />
                       <Image 
                          source={require('../assets/moon-glitter.png')} 
                          style={styles.moonImage}
                          resizeMode="contain"
                       />
                    </Animated.View>

                    <Text style={styles.brandName}>Luna</Text>

                    <TouchableOpacity 
                        style={[styles.goldButton, styles.introButtonMargin, { zIndex: 100 }]} 
                        onPress={handleContinue} 
                        activeOpacity={0.8}
                    >
                        <Text style={styles.goldButtonText}>COMENZAR</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* --- INPUT --- */}
                {step === 'input' && (
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
                        <Text style={styles.topHeader}>TU PERFIL ASTRAL</Text>
                        <MysticDivider />
                        <View style={styles.formSpacer} />

                        <MysticInput 
                            label="Nombre" placeholder="Nombre" value={name} onChangeText={(t) => {setName(t); setErrors({...errors, name: ''})}} error={errors.name} containerStyle={{ marginBottom: 20 }}
                        />
                        <MysticInput 
                            label="Fecha de Nacimiento" placeholder="DD/MM/AAAA" value={birthDate} onChangeText={handleDateChange} error={errors.birthDate} keyboardType="numeric" maxLength={10} containerStyle={{ marginBottom: 20 }}
                        />
                        
                        {detectedZodiac ? (
                            <Animated.View style={styles.zodiacBadge}>
                                <Ionicons name="sparkles" size={16} color={THEME.gold} />
                                <Text style={styles.zodiacText}>{detectedZodiac}</Text>
                            </Animated.View>
                        ) : (
                            <Text style={styles.zodiacNote}>La fecha revela tu destino</Text>
                        )}

                        <TouchableOpacity 
                            style={[styles.goldButton, { marginTop: 40, zIndex: 100 }]} 
                            onPress={handleContinue} 
                            disabled={isLoading} 
                            activeOpacity={0.8}
                        >
                        <Text style={styles.goldButtonText}>{isLoading ? 'CONECTANDO...' : 'CONTINUAR'}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                )}

                {/* --- ANIMATION --- */}
                {step === 'animation' && (
                  <Animated.View style={[styles.centerContent, { opacity: fadeAnim, justifyContent: 'center', flex: 1 }]}>
                    <Animated.View style={[styles.pulsingSphere, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.loaderText}>{loadingText}</Text>
                  </Animated.View>
                )}

             </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  backgroundFill: { position: 'absolute', width: '100%', height: '100%', backgroundColor: THEME.bg },
  star: { position: 'absolute', backgroundColor: '#FFF', borderRadius: 50 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  centerContent: { alignItems: 'center', width: '100%' },

  topHeader: {
    fontFamily: THEME.fontSerif, fontSize: 18, color: '#FFF', letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 15, textAlign: 'center', fontWeight: '300'
  },
  serifSubtitle: {
    fontFamily: THEME.fontSerif, fontSize: 20, color: '#FFF', textAlign: 'center',
    lineHeight: 30, marginTop: 20, fontWeight: '400', marginBottom: 0
  },
  brandName: {
    fontFamily: THEME.fontSerif, fontSize: 56, color: '#FFF', marginTop: 20,
    marginBottom: 10, letterSpacing: 2,
  },

  dividerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: 200, 
    justifyContent: 'center',
    alignSelf: 'center' 
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(212, 175, 55, 0.5)' },
  dividerIconContainer: { marginHorizontal: 10 },

  moonContainer: { marginVertical: 20, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  moonImage: { width: 180, height: 180 },
  goldGlow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(212, 175, 55, 0.2)', zIndex: -1,
  },

  goldButton: {
    backgroundColor: THEME.gold, paddingVertical: 18, paddingHorizontal: 40,
    borderRadius: 8, width: '100%', alignItems: 'center',
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  introButtonMargin: { marginTop: 50 },
  goldButtonText: {
    color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  formSpacer: { height: 40 },
  zodiacBadge: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 12, borderRadius: 8, 
    borderWidth: 1, borderColor: THEME.goldDim, marginTop: 10 
  },
  zodiacText: { color: THEME.gold, fontSize: 18, fontFamily: THEME.fontSerif },
  zodiacNote: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 15, fontStyle: 'italic', fontFamily: THEME.fontSerif },

  pulsingSphere: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.violet, 
    marginBottom: 40,
    shadowColor: THEME.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  loaderText: { color: THEME.gold, fontSize: 20, fontFamily: THEME.fontSerif, letterSpacing: 1, marginTop: 10, textAlign: 'center' }
});