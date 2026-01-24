import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Alert, Share, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';
import MagicAlert from '../../src/components/MagicAlert';
import analytics from '@react-native-firebase/analytics';
import { THEME } from '../../src/constants/theme'; // Импорт
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBootstrapProfile } from '../../src/services/bootstrapProfile';

const { width, height } = Dimensions.get('window');

// --- LOCAL ANSWERS (ESPAÑOL) ---
const MAGICAL_ANSWERS = [
  "Las estrellas dicen: SÍ.",
  "El destino es incierto, pregunta más tarde.",
  "La respuesta es un NO rotundo.",
  "El universo te favorece.",
  "Escucha a tu intuición, no miente.",
  "Se acercan grandes cambios.",
  "No es el momento adecuado.",
  "La paciencia traerá recompensas.",
  "Presta atención a las señales.",
  "Tu deseo se cumplirá de forma inesperada.",
  "Cuidado con las decisiones apresuradas.",
  "La suerte está de tu lado."
];

// Component for twinkling stars effect
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
  const insets = useSafeAreaInsets(); // Хук для отступов
  const { isPremium, credits, spendEnergy, refreshStatus } = useMonetization();
  
  useFocusEffect(
    useCallback(() => {
      analytics().logScreenView({
        screen_name: 'Oráculo',
        screen_class: 'OracleScreen',
      });
      refreshStatus(); 
    }, [])
  );
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const bootstrapProfile = getBootstrapProfile();
  const [userProfile, setUserProfile] = useState<any>(
    bootstrapProfile?.name || bootstrapProfile?.zodiac
      ? { display_name: bootstrapProfile?.name, zodiac_sign: bootstrapProfile?.zodiac }
      : null
  );
  const [showEnergyAlert, setShowEnergyAlert] = useState(false);

  useLayoutEffect(() => {
    const hydrateFromCache = async () => {
      try {
        const cachedName = await AsyncStorage.getItem('user_name');
        const cachedSign = await AsyncStorage.getItem('user_zodiac');

        if (cachedName || cachedSign) {
          setUserProfile((prev: any) => ({
            display_name: cachedName ?? prev?.display_name,
            zodiac_sign: cachedSign ?? prev?.zodiac_sign,
          }));
        }
      } catch (e) {
        // ignore
      }
    };

    hydrateFromCache();
  }, []);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const continuousPulse = useRef(new Animated.Value(1)).current;
  const glowIntensity = useRef(new Animated.Value(0.4)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const hintTextOpacity = useRef(new Animated.Value(0)).current;

  // Background animations init
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(continuousPulse, { toValue: 1.08, duration: 2500, useNativeDriver: true }),
        Animated.timing(continuousPulse, { toValue: 0.92, duration: 2500, useNativeDriver: true }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowIntensity, { toValue: 0.9, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowIntensity, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    glow.start();
    
    setTimeout(() => {
      Animated.timing(hintTextOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }, 500);
    
    return () => { pulse.stop(); glow.stop(); };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        await refreshStatus();
        await fetchProfile();
      };
      refresh();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, zodiac_sign')
          .eq('id', user.id)
          .maybeSingle();
        setUserProfile((prev: any) => ({
          display_name: data?.display_name ?? prev?.display_name,
          zodiac_sign: data?.zodiac_sign ?? prev?.zodiac_sign,
        }));

        if (data?.display_name) {
          await AsyncStorage.setItem('user_name', data.display_name);
        }
        if (typeof data?.zodiac_sign === 'string') {
          await AsyncStorage.setItem('user_zodiac', data.zodiac_sign);
        }
      }
    } catch (e) { console.log('Error loading profile:', e); }
  };

  const handleShare = async () => {
    if (!oracleAnswer) return;
    try {
      await Share.share({
        message: `🔮 Oráculo dice:\n\n${oracleAnswer}\n\n✨ Luna`,
        url: 'https://suenos-ai.app'
      });
    } catch (error) { console.log('Error sharing:', error); }
  };

  const startOracle = async () => {
    Keyboard.dismiss();
    if (isLoading) return;

    if (isPremium) {
      await executeOracle();
      return;
    }

    if (credits < 1) {
      setShowEnergyAlert(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const success = await spendEnergy(1);
    if (!success) return;

      await refreshStatus();
      await executeOracle();
      
    } catch (error) {
      console.error('Error in startOracle:', error);
      Alert.alert('Error', 'Algo salió mal');
    }
  };

  const executeOracle = async () => {
    setIsLoading(true);
    setIsPulsing(true);
    setShowAnswer(false);
    setOracleAnswer('');

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const rapidPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 400, useNativeDriver: true }),
      ])
    );
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ])
    );
    rapidPulse.start();
    glowPulse.start();

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * MAGICAL_ANSWERS.length);
        const response = MAGICAL_ANSWERS[randomIndex];

        rapidPulse.stop();
        glowPulse.stop();
        pulseAnim.setValue(1);
        glowAnim.setValue(0.3);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setOracleAnswer(response);
        setShowAnswer(true);
        setIsPulsing(false);
        setIsLoading(false);
        
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 2000); 
  };

  const resetOracle = () => {
    setShowAnswer(false);
    setOracleAnswer('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0f0c29', '#1A0029', '#000000']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <View style={styles.stardustContainer}>
        {[...Array(50)].map((_, i) => ( <TwinklingStar key={i} index={i} /> ))}
      </View>
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>¡Hola, {userProfile?.display_name || 'Viajero'}!</Text>
            <Text style={styles.zodiacText}>{userProfile?.zodiac_sign || '...'}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/energy')}
            style={styles.energyBadge}
          >
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.energyText}>{isPremium ? '∞' : credits}</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {!showAnswer && (
          <Animated.View style={[styles.hintContainer, { opacity: hintTextOpacity }]}>
            <Text style={styles.hintText}>Concéntrate en tu pregunta...</Text>
          </Animated.View>
        )}

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
                  styles.outerGlow,
                  {
                    opacity: isPulsing ? glowAnim : glowIntensity,
                    transform: [{ scale: isPulsing ? pulseAnim : continuousPulse }],
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.sphere,
                  {
                    transform: [
                      { scale: isPulsing ? pulseAnim : continuousPulse },
                      { scale: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] })}
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
                      <Text style={styles.sphereText}>TOCA EL DESTINO</Text>
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
                <View style={styles.answerHeader}>
                  <Text style={styles.answerTitle}>EL ORÁCULO DICE</Text>
                  {oracleAnswer && (
                    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                      <Ionicons name="share-social-outline" size={24} color="#FFD700" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.answerText}>{oracleAnswer}</Text>
              </Animated.View>
              <TouchableOpacity style={styles.resetButton} onPress={resetOracle}>
                <Ionicons name="refresh-outline" size={20} color="#ffd700" />
                <Text style={styles.resetText}>Nueva Pregunta</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      <MagicAlert 
        visible={showEnergyAlert}
        title="Oráculo Cansado"
        message="Necesitas energía para conectar. ¿Recargar?"
        icon="flash"
        confirmText="Ir a la Tienda"
        cancelText="Más tarde"
        onConfirm={() => { setShowEnergyAlert(false); router.push('/energy'); }}
        onCancel={() => setShowEnergyAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  stardustContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, minHeight: 50 },
  headerTextContainer: { flex: 1 },
  
  // --- ТИПОГРАФИКА ---
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 0.5, fontFamily: THEME.fonts.serif },
  zodiacText: { fontSize: 16, color: '#A855F7', marginTop: 4, fontWeight: '600', fontFamily: THEME.fonts.serif },
  
  energyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  energyText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  
  oracleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  
  hintContainer: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  hintText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 16, fontStyle: 'italic', textAlign: 'center', fontFamily: THEME.fonts.serif },
  
  sphereContainer: { alignItems: 'center', justifyContent: 'center' },
  outerGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(147, 51, 234, 0.3)' },
  sphere: { width: 200, height: 200, borderRadius: 100 },
  sphereGradient: { flex: 1, borderRadius: 100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(147, 51, 234, 0.4)' },
  sphereContent: { alignItems: 'center' },
  
  // Текст на шаре - Serif (очень важно для атмосферы)
  sphereText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginTop: 12, letterSpacing: 2, fontFamily: THEME.fonts.serif },
  
  answerContainer: { alignItems: 'center', width: '100%' },
  answerSphere: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255, 215, 0, 0.3)' },
  answerBox: { backgroundColor: 'rgba(255, 215, 0, 0.05)', borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)', minHeight: 100, width: '100%' },
  answerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'space-between' },
  
  // Заголовок ответа - Serif
  answerTitle: { fontSize: 18, fontWeight: '700', color: '#ffd700', textAlign: 'center', flex: 1, fontFamily: THEME.fonts.serif, letterSpacing: 2 },
  
  shareButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  
  // Сам ответ оракула - Serif (выглядит как пророчество)
  answerText: { color: '#ffd700', fontSize: 20, lineHeight: 28, textAlign: 'center', fontStyle: 'italic', fontFamily: THEME.fonts.serif },
  
  resetButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', marginTop: 20 },
  resetText: { color: '#ffd700', fontSize: 14, marginLeft: 8, fontFamily: THEME.fonts.serif },
});