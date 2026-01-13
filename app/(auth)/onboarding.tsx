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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MysticButton } from '../../src/components/ui/MysticButton';
import { MysticInput } from '../../src/components/ui/MysticInput';
import { Colors } from '../../src/constants/Colors';

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'intro' | 'input' | 'animation';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState({ name: '', birthDate: '' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
        router.replace({ 
          pathname: '/(tabs)/suenos', 
          params: { name, date: birthDate } 
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleDateChange = (text: string) => {
    // 1. Handle Deletion (Backspace)
    // If the new text is shorter than the current state, user is deleting. 
    // Let them delete freely without forcing the mask.
    if (text.length < birthDate.length) {
      setBirthDate(text);
      return;
    }

    // 2. Handle Typing (Masking)
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    }

    // Limit to 10 chars (DD/MM/YYYY)
    if (formatted.length <= 10) {
      setBirthDate(formatted);
    }
  };

  const validateInputs = () => {
    const newErrors = { name: '', birthDate: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Por favor, ingresa tu nombre';
      isValid = false;
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = 'Por favor, ingresa tu fecha de nacimiento';
      isValid = false;
    } else {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(birthDate)) {
        newErrors.birthDate = 'Formato: DD/MM/AAAA';
        isValid = false;
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
        setStep('animation');
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
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
        colors={[Colors.background.primary, Colors.background.secondary, Colors.background.tertiary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <Text style={styles.title}>Bienvenido a Sueños AI</Text>
            <Text style={styles.lunaName}>Luna</Text>
            <Text style={styles.subtitle}>
              Soy la energía que interpreta las señales del universo para ti.
            </Text>
            <Text style={styles.description}>
              Permíteme guiarte a través del misterioso mundo de tus sueños y descubrir los mensajes ocultos que el cosmos tiene para ti.
            </Text>
          </View>
          <MysticButton
            title="Comenzar"
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
                <Text style={styles.inputTitle}>Cuéntame sobre ti</Text>
                <Text style={styles.inputSubtitle}>
                  Para personalizar tu experiencia cósmica
                </Text>

                <MysticInput
                  label="Nombre"
                  placeholder="¿Cómo te llamas?"
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
                  label="Fecha de nacimiento"
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChangeText={handleDateChange}
                  error={errors.birthDate}
                  keyboardType="numeric"
                  maxLength={10}
                  containerStyle={styles.input}
                />

                <Text style={styles.zodiacNote}>
                  ✨ Tu fecha de nacimiento me ayudará a conectar con tu energía astral
                </Text>
              </View>

              <MysticButton
                title="Continuar"
                onPress={handleContinue}
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
            <Text style={styles.animationText}>Analizando tu carta astral...</Text>
            <Text style={styles.animationSubtext}>Conectando con las estrellas...</Text>
            <Text style={styles.animationSubtext}>Preparando tu experiencia mística...</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  lunaName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.accent.gold,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.text.muted,
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
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputSubtitle: {
    fontSize: 16,
    color: Colors.text.muted,
    marginBottom: 32,
  },
  input: {
    marginBottom: 24,
  },
  zodiacNote: {
    fontSize: 14,
    color: Colors.mystic.lavender,
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
    borderColor: Colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: Colors.mystic.violet,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 70, 193, 0.2)',
  },
  cosmicIcon: {
    fontSize: 60,
  },
  animationText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.accent.gold,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  animationSubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
});
