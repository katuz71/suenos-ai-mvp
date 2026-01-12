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
import { useTranslation } from 'react-i18next';
import { MysticButton } from '../../src/components/ui/MysticButton';
import { MysticInput } from '../../src/components/ui/MysticInput';
import { Colors } from '../../src/constants/Colors';
import { supabase } from '../../src/services/supabase';
import { calculateZodiac, formatDateForDB } from '../../src/utils/zodiac';

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'intro' | 'input' | 'animation';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState({ name: '', birthDate: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        router.replace('/(tabs)');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
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
      newErrors.name = t('onboarding.nameError');
      isValid = false;
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = t('onboarding.birthDateError');
      isValid = false;
    } else {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(birthDate)) {
        newErrors.birthDate = t('onboarding.birthDateFormatError');
        isValid = false;
      } else {
        const parts = birthDate.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2024) {
          newErrors.birthDate = t('onboarding.birthDateInvalidError');
          isValid = false;
        }
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
        setIsAnalyzing(true);
        setStep('animation');
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();

        try {
          const startTime = Date.now();

          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          
          if (authError) throw authError;
          if (!authData.session) throw new Error('No session created');

          const parts = birthDate.split('/');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const zodiacSign = calculateZodiac(day, month);
          const dbDate = formatDateForDB(birthDate);

          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.session.user.id,
            display_name: name,
            birth_date: dbDate,
            zodiac_sign: zodiacSign,
          });

          if (profileError) throw profileError;

          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 3000 - elapsed);

          setTimeout(() => {
            router.replace('/(tabs)');
          }, remainingDelay);
        } catch (error) {
          console.error('Error during onboarding:', error);
          setIsAnalyzing(false);
          setErrors({ ...errors, birthDate: t('onboarding.errorConnecting') });
          setStep('input');
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
            <Text style={styles.title}>{t('onboarding.welcome')}</Text>
            <Text style={styles.lunaName}>Luna</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.subtitle')}
            </Text>
            <Text style={styles.description}>
              {t('onboarding.description')}
            </Text>
          </View>
          <MysticButton
            title={t('onboarding.startButton')}
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
                <Text style={styles.inputTitle}>{t('onboarding.welcome')}</Text>
                <Text style={styles.inputSubtitle}>
                  {t('onboarding.subtitle')}
                </Text>

                <MysticInput
                  label={t('onboarding.nameLabel')}
                  placeholder={t('onboarding.namePlaceholder')}
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
                  label={t('onboarding.birthDateLabel')}
                  placeholder={t('onboarding.birthDatePlaceholder')}
                  value={birthDate}
                  onChangeText={handleDateChange}
                  error={errors.birthDate}
                  keyboardType="numeric"
                  maxLength={10}
                  containerStyle={styles.input}
                />

                <Text style={styles.zodiacNote}>
                  ✨ {t('onboarding.subtitle')}
                </Text>
              </View>

              <MysticButton
                title={t('onboarding.continueButton')}
                onPress={handleContinue}
                loading={isAnalyzing}
                disabled={isAnalyzing}
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
            <Text style={styles.animationText}>{t('onboarding.analyzingTitle')}</Text>
            <Text style={styles.animationSubtext}>{t('onboarding.analyzingSubtext')}</Text>
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
