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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MysticButton } from '../../src/components/ui/MysticButton';
import { MysticInput } from '../../src/components/ui/MysticInput';
import { Colors } from '../../src/constants/Colors';

type OnboardingStep = 'intro' | 'input' | 'animation';

// Хелпер для определения знака зодиака
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
  const [detectedZodiac, setDetectedZodiac] = useState(''); // Авто-определение знака
  const [errors, setErrors] = useState({ name: '', birthDate: '' });
  const [loadingText, setLoadingText] = useState('Analizando tu carta astral...');

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

  // Анимация загрузки с меняющимся текстом
  useEffect(() => {
    if (step === 'animation') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      ).start();

      // Смена текстов для атмосферы
      const texts = [
        'Conectando con las estrellas...',
        'Calculando tu ascendente...',
        'Interpretando tu energía...',
        '¡Todo listo!'
      ];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < texts.length) setLoadingText(texts[i]);
      }, 1500);

      const timer = setTimeout(() => {
        clearInterval(interval);
        // Передаем также определенный знак зодиака
        router.replace({ 
          pathname: '/(tabs)/suenos', 
          params: { name, date: birthDate, zodiac: detectedZodiac } 
        });
      }, 5000); // Чуть дольше (5с), чтобы успеть прочитать тексты
      
      return () => { clearTimeout(timer); clearInterval(interval); };
    }
  }, [step]);

  const handleDateChange = (text: string) => {
    // Удаляем все нецифровые символы
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    // Форматируем DD/MM/YYYY
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    
    // Ограничиваем длину
    if (formatted.length <= 10) {
      setBirthDate(formatted);
      setErrors({ ...errors, birthDate: '' });

      // Пытаемся определить знак зодиака на лету
      if (cleaned.length >= 4) { // Есть хотя бы день и месяц
        const d = parseInt(cleaned.slice(0, 2));
        const m = parseInt(cleaned.slice(2, 4));
        if (d > 0 && d <= 31 && m > 0 && m <= 12) {
          const sign = getZodiacSign(d, m);
          setDetectedZodiac(sign);
        } else {
          setDetectedZodiac('');
        }
      } else {
        setDetectedZodiac('');
      }
    }
  };

  const validateInputs = () => {
    const newErrors = { name: '', birthDate: '' };
    let isValid = true;
    
    if (!name.trim()) { newErrors.name = 'Por favor, ingresa tu nombre'; isValid = false; }
    
    if (!birthDate.trim()) { 
      newErrors.birthDate = 'Por favor, ingresa tu fecha de nacimiento'; 
      isValid = false; 
    } else {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);
      
      if (!match) { 
        newErrors.birthDate = 'Formato: DD/MM/AAAA'; 
        isValid = false; 
      } else {
        const d = parseInt(match[1]);
        const m = parseInt(match[2]);
        const y = parseInt(match[3]);
        const currentYear = new Date().getFullYear();

        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > currentYear) {
           newErrors.birthDate = 'Fecha inválida';
           isValid = false;
        }
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (step === 'intro') {
      setStep('input');
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else if (step === 'input') {
      if (validateInputs()) {
        Keyboard.dismiss(); // Скрываем клавиатуру перед анимацией
        setStep('animation');
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    }
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.primary, Colors.background.secondary, Colors.background.tertiary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={step === 'input'} // Включаем скролл только на шаге ввода
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[
              styles.content, 
              { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20, justifyContent: 'center' }
            ]}>

              {step === 'intro' && (
                <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                  <Text style={styles.lunaIcon}>🌙</Text>
                  <Text style={styles.title}>Bienvenido a Sueños AI</Text>
                  <Text style={styles.lunaName}>Luna</Text>
                  <Text style={styles.subtitle}>Soy la energía que interpreta las señales del universo para ti.</Text>
                  <Text style={styles.description}>Permíteme guiarte a través del misterioso mundo de tus sueños.</Text>
                  <View style={{ marginTop: 40, width: '100%', paddingHorizontal: 40 }}>
                    <MysticButton title="Comenzar" onPress={handleContinue} />
                  </View>
                </Animated.View>
              )}

              {step === 'input' && (
                <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
                  <View style={{ marginBottom: 40 }}>
                    <Text style={styles.inputTitle}>Cuéntame sobre ti</Text>
                    <Text style={styles.inputSubtitle}>Para personalizar tu experiencia cósmica</Text>
                  </View>

                  <View>
                    <MysticInput
                      label="Nombre"
                      placeholder="¿Cómo te llamas?"
                      value={name}
                      onChangeText={(text) => { setName(text); setErrors({ ...errors, name: '' }); }}
                      error={errors.name}
                      autoCapitalize="words"
                      containerStyle={{ marginBottom: 24 }}
                    />

                    <MysticInput
                      label="Fecha de nacimiento"
                      placeholder="DD/MM/AAAA"
                      value={birthDate}
                      onChangeText={handleDateChange}
                      error={errors.birthDate}
                      keyboardType="numeric"
                      maxLength={10}
                      containerStyle={{ marginBottom: 12 }}
                    />
                    
                    {/* Показываем знак зодиака, если определили */}
                    {detectedZodiac ? (
                      <Animated.View style={styles.zodiacBadge}>
                        <Text style={styles.zodiacText}>Tu signo parece ser: <Text style={{fontWeight: 'bold', color: Colors.accent.gold}}>{detectedZodiac}</Text></Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.zodiacNote}>✨ Tu fecha de nacimiento me ayudará a conectar con tu energía astral</Text>
                    )}
                  </View>

                  <View style={{ marginTop: 30 }}>
                    <MysticButton title="Continuar" onPress={handleContinue} />
                  </View>
                </Animated.View>
              )}

              {step === 'animation' && (
                <Animated.View style={styles.animationContainer}>
                  <Animated.View style={[styles.cosmicCircle, { transform: [{ scale: pulseAnim }, { rotate: spin }] }]}>
                    <View style={styles.innerCircle}>
                      <Text style={styles.cosmicIcon}>✨</Text>
                    </View>
                  </Animated.View>
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.animationText}>{loadingText}</Text>
                    {detectedZodiac && <Text style={styles.animationSubtext}>Conectando con la energía de {detectedZodiac}...</Text>}
                  </Animated.View>
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
  container: { flex: 1, backgroundColor: Colors.background.primary },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  content: { flex: 1, paddingHorizontal: 24 },
  
  lunaIcon: { fontSize: 80, marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: Colors.text.primary, textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  lunaName: { fontSize: 24, fontWeight: '600', color: Colors.accent.gold, textAlign: 'center', marginBottom: 24, letterSpacing: 1 },
  subtitle: { fontSize: 18, color: Colors.text.secondary, textAlign: 'center', marginBottom: 20, lineHeight: 26, paddingHorizontal: 10 },
  description: { fontSize: 16, color: Colors.text.muted, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  
  inputTitle: { fontSize: 28, fontWeight: '700', color: Colors.text.primary, marginBottom: 8, letterSpacing: 0.5 },
  inputSubtitle: { fontSize: 16, color: Colors.text.muted },
  
  zodiacNote: { fontSize: 14, color: Colors.mystic.lavender, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  zodiacBadge: { backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', marginTop: 8 },
  zodiacText: { color: Colors.text.primary, textAlign: 'center', fontSize: 16 },

  animationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cosmicCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.accent.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 60 },
  innerCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: Colors.mystic.violet, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(107, 70, 193, 0.2)' },
  cosmicIcon: { fontSize: 60 },
  animationText: { fontSize: 24, fontWeight: '600', color: Colors.accent.gold, textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 },
  animationSubtext: { fontSize: 16, color: Colors.text.secondary, textAlign: 'center', marginBottom: 12, opacity: 0.8 },
});