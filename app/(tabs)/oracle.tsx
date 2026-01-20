import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Alert, Share, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';
import MagicAlert from '../../src/components/MagicAlert';

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
  const { isPremium, credits, refreshStatus } = useMonetization();
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showEnergyAlert, setShowEnergyAlert] = useState(false);
  
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
        setUserProfile(data);
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
      
      const { error } = await supabase.rpc('consume_credit', { user_id: user.id });
      if (error) throw error;

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={['#2E004E', '#1A0029', '#000000']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <View style={styles.stardustContainer}>
        {[...Array(50)].map((_, i) => ( <TwinklingStar key={i} index={i} /> ))}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            {userProfile ? (
              <>
                <Text style={styles.greeting}>¡Hola, {userProfile.display_name || 'Viajero'}!</Text>
                <Text style={styles.zodiacText}>{userProfile.zodiac_sign || 'Misterioso'}</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#FFD700" />
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/energy')}
            style={styles.energyBadge}
          >
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.energyText}>{isPremium ? '∞' : credits}</Text>
          </TouchableOpacity>
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  stardustContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, marginBottom: 60 },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#fff' },
  zodiacText: { fontSize: 18, color: '#ffd700', marginTop: 4 },
  energyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', marginTop: -20 },
  energyText: { color: '#ffd700', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  hintContainer: { alignItems: 'center', marginBottom: 40 },
  hintText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  oracleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sphereContainer: { alignItems: 'center', justifyContent: 'center' },
  outerGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(147, 51, 234, 0.3)' },
  sphere: { width: 200, height: 200, borderRadius: 100 },
  sphereGradient: { flex: 1, borderRadius: 100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(147, 51, 234, 0.4)' },
  sphereContent: { alignItems: 'center' },
  sphereText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginTop: 12, letterSpacing: 2 },
  answerContainer: { alignItems: 'center', width: '100%' },
  answerSphere: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255, 215, 0, 0.3)' },
  answerBox: { backgroundColor: 'rgba(255, 215, 0, 0.05)', borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)', minHeight: 100 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'space-between' },
  answerTitle: { fontSize: 18, fontWeight: '700', color: '#ffd700', textAlign: 'center', flex: 1 },
  shareButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  answerText: { color: '#ffd700', fontSize: 20, lineHeight: 28, textAlign: 'center', fontStyle: 'italic' },
  resetButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', marginTop: 20 },
  resetText: { color: '#ffd700', fontSize: 14, marginLeft: 8 },
});