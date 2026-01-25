import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, LayoutAnimation, Dimensions, Platform, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { generateDailyHoroscope } from '../../src/services/openai';
import MagicAlert from '../../src/components/MagicAlert';
import AdBanner from '../../src/components/AdBanner';
import analytics from '@react-native-firebase/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBootstrapProfile } from '../../src/services/bootstrapProfile';

// Включаем анимацию для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Очистка текста от лишних символов Markdown (**bold** и т.д.)
const cleanText = (text: string) => {
  if (!text) return "";
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').trim();
};

// Генерация характеристик дня (псевдо-случайно на основе даты и знака)
// Это экономит токены: мы не спрашиваем AI про цифры, а считаем их сами.
const getDailyStats = (sign: string) => {
  if (!sign) return { love: 0, health: 0, money: 0, luckyNumber: 0, color: '...' };
  const todayStr = new Date().toISOString().split('T')[0];
  const seedString = `${sign}-${todayStr}`;

  // Простой генератор случайных чисел с seed (чтобы цифры не менялись при перезагрузке)
  const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  };

  return {
    love: Math.floor(pseudoRandom(seedString + 'love') * 40) + 60,
    health: Math.floor(pseudoRandom(seedString + 'health') * 40) + 60,
    money: Math.floor(pseudoRandom(seedString + 'money') * 40) + 60,
    luckyNumber: Math.floor(pseudoRandom(seedString + 'num') * 99) + 1,
    color: ['Dorado', 'Púrpura', 'Azul Real', 'Esmeralda', 'Rubí', 'Plata', 'Blanco', 'Índigo'][Math.floor(pseudoRandom(seedString + 'col') * 8)]
  };
};

export default function HoroscopeScreen() {
  const router = useRouter();
  const { isPremium, credits, refreshStatus, spendEnergy } = useMonetization();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const bootstrapProfile = getBootstrapProfile();
  const [name, setName] = useState(bootstrapProfile?.name || 'Viajero');
  const [zodiacSign, setZodiacSign] = useState(bootstrapProfile?.zodiac || '');
  const [prediction, setPrediction] = useState('');
  const [stats, setStats] = useState({ love: 0, health: 0, money: 0, luckyNumber: 0, color: '...' });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', icon: '' });

  useLayoutEffect(() => {
    const hydrateHeaderFromCache = async () => {
      try {
        const cachedName = await AsyncStorage.getItem('user_name');
        const cachedSign = await AsyncStorage.getItem('user_zodiac');

        if (cachedName) setName(cachedName);
        if (cachedSign) {
          setZodiacSign(cachedSign);
          setStats(getDailyStats(cachedSign));
        }
      } catch (e) {
        // ignore
      }
    };

    hydrateHeaderFromCache();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('display_name, zodiac_sign').eq('id', user.id).single();

      if (profile) {
        if (typeof profile.display_name === 'string' && profile.display_name.trim()) {
          setName(profile.display_name);
          await AsyncStorage.setItem('user_name', profile.display_name);
        }

        if (typeof profile.zodiac_sign === 'string') {
          const sign = profile.zodiac_sign;
          if (sign) {
            setZodiacSign(sign);
            setStats(getDailyStats(sign));
            await AsyncStorage.setItem('user_zodiac', sign);
            // ИСПРАВЛЕНИЕ: Передаем 'Viajero' для генерации текста, чтобы кэш был общим
            fetchDailyHoroscope(sign, 'Viajero');
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyHoroscope = async (sign: string, genericName: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      // 1. Ищем готовый гороскоп в базе
      const { data: existing } = await supabase.from('daily_horoscopes').select('prediction_text').eq('zodiac_sign', sign).eq('date', today).maybeSingle();

      if (existing) {
        setPrediction(existing.prediction_text);
      } else {
        // 2. Если нет - генерируем новый через AI
        setIsGenerating(true);
        // Генерируем текст с нейтральным именем (genericName), чтобы он подходил всем
        const text = await generateDailyHoroscope(sign, genericName);

        // 3. Сохраняем в общую базу для всех пользователей этого знака
        await supabase.from('daily_horoscopes').insert({ zodiac_sign: sign, date: today, prediction_text: text });

        setPrediction(text);
        setIsGenerating(false);
      }
    } catch (e) {
      setPrediction("Las estrellas están nubladas hoy. Intenta más tarde.");
      setIsGenerating(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      analytics().logScreenView({
        screen_name: 'Horóscopo',
        screen_class: 'HoroscopoScreen',
      });
      loadData();
      refreshStatus();
    }, [])
  );

  const handleUnlock = async () => {
    if (credits < 1) {
      setAlertConfig({ visible: true, title: "Poca Energía", message: "Necesitas energía para revelar el destino.", icon: "flash" });
      return;
    }

    const success = await spendEnergy(1);
    if (success) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsUnlocked(true);
      analytics().logEvent('horoscope_unlocked', { sign: zodiacSign });
    }
  };

  const StatBar = ({ label, value, color, icon }: any) => (
    <View style={styles.statRow}>
      <View style={styles.statLabelContainer}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <LinearGradient colors={[color, '#fff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${value}%` }]} />
      </View>
      <Text style={styles.statValue}>{value}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#24243e']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>¡Hola, {name}!</Text>
          <Text style={styles.zodiacText}>{zodiacSign || '...'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/energy')} style={styles.energyBadgeBtn}>
          <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
          <Text style={styles.energyBadgeText}>{isPremium ? '∞' : credits}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* АТРИБУТЫ (Цифра и Цвет) */}
        <View style={styles.attributesContainer}>
          <View style={styles.attributeBox}>
            <Text style={styles.attrLabel}>NÚMERO</Text>
            <Text style={styles.attrValue}>{stats.luckyNumber || '-'}</Text>
          </View>
          <View style={[styles.attributeBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.attrLabel}>COLOR</Text>
            <Text style={styles.attrValue} numberOfLines={1}>{stats.color || '-'}</Text>
          </View>
        </View>

        {/* СТАТИСТИКА (Amor, Salud, Dinero) */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Tu Energía Hoy</Text>
          <StatBar label="Amor" value={stats.love} color="#FF6B6B" icon="heart" />
          <StatBar label="Salud" value={stats.health} color="#4ECDC4" icon="fitness" />
          <StatBar label="Dinero" value={stats.money} color="#FFD93D" icon="cash" />
        </View>

        {/* ТЕКСТ ГОРОСКОПА (С Блокировкой) */}
        <View style={styles.predictionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon" size={20} color="#ffd700" />
            <Text style={styles.cardTitle}>Mensaje de los Astros</Text>
          </View>

          <View style={[styles.textContainer, (!isUnlocked && !isPremium) && styles.textLocked]}>
            {isGenerating ? (
              <ActivityIndicator color="#FFD700" style={{ margin: 20 }} />
            ) : (
              <Text style={styles.predictionText}>
                {(!isUnlocked && !isPremium && prediction)
                  ? cleanText(prediction).substring(0, 70) + '...' // Размытый текст для бесплатных
                  : cleanText(prediction) || "Conectando..."}
              </Text>
            )}

            {/* ОВЕРЛЕЙ БЛОКИРОВКИ */}
            {!isUnlocked && !isPremium && !isGenerating && prediction && (
              <View style={styles.lockOverlay}>
                <LinearGradient colors={['transparent', '#0f0c29']} style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
                  <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.unlockGradient}>
                    <Ionicons name="lock-closed" size={18} color="#fff" />
                    <Text style={styles.unlockText}>Revelar (-1 ✨)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <AdBanner />
      </ScrollView>

      {/* АЛЕРТЫ */}
      <MagicAlert
        visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} icon={alertConfig.icon as any}
        confirmText={alertConfig.title === "Poca Energía" ? "Ir a Tienda" : "Aceptar"}
        onConfirm={() => {
          if (alertConfig.title === "Poca Energía") router.push('/energy');
          setAlertConfig({ ...alertConfig, visible: false });
        }}
        onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, minHeight: 50 },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: Platform.OS === 'ios' ? '700' : 'normal', color: '#fff', letterSpacing: 0.5, fontFamily: THEME.fonts.serif },
  zodiacText: { fontSize: 16, color: '#A855F7', marginTop: 4, fontWeight: Platform.OS === 'ios' ? '600' : 'normal', fontFamily: THEME.fonts.serif },
  energyBadgeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  energyBadgeText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, fontFamily: THEME.fonts.serif },
  attributesContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  attributeBox: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  attrLabel: { color: '#94A3B8', fontSize: 12, letterSpacing: 1, marginBottom: 5 },
  attrValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: THEME.fonts.serif },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statsTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 15, fontFamily: THEME.fonts.serif },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statLabelContainer: { flexDirection: 'row', alignItems: 'center', width: 85 },
  statLabel: { color: '#E2E8F0', marginLeft: 8, fontSize: 14, fontFamily: THEME.fonts.serif },
  progressBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', width: 35, textAlign: 'right', fontFamily: THEME.fonts.serif },
  predictionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 10, fontFamily: THEME.fonts.serif },
  textContainer: { position: 'relative', minHeight: 80 },
  textLocked: { maxHeight: 100, overflow: 'hidden' },
  predictionText: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.85)', fontFamily: THEME.fonts.serif },
  lockOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, justifyContent: 'flex-end', alignItems: 'center' },
  unlockButton: { width: '100%', borderRadius: 20, shadowColor: '#FFB800', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  unlockGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20 },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8, fontFamily: THEME.fonts.serif, letterSpacing: 1 },
});

