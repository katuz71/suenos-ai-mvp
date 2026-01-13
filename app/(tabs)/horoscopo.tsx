import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';
import { interpretDream } from '../../src/services/openai';

const { width } = Dimensions.get('window');

export default function HoroscopeScreen() {
  const router = useRouter();
  const { isPremium, refreshStatus } = useMonetization();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyPrediction, setDailyPrediction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [extendedPrediction, setExtendedPrediction] = useState<string>('');
  const [magicAttributes, setMagicAttributes] = useState<{
    number: string;
    color: string;
    talisman: string;
  } | null>(null);

  // СИНХРОНИЗАЦИЯ ПРИ ФОКУСЕ НА ВКЛАДКУ
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [])
  );

  // Начальная загрузка профиля
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, zodiac_sign')
          .eq('id', user.id)
          .single();

        setUserProfile(data);
        
        // Загрузка прогноза
        if (data?.zodiac_sign) {
          try {
            const response = await interpretDream("Прогноз на день", {
              mode: 'horoscope',
              userContext: {
                zodiac: data.zodiac_sign,
                name: data.display_name,
                isPremium: isPremium
              }
            });
            
            // Разбираем ответ на части для Premium
            if (isPremium && response.includes('Глубокий анализ:')) {
              const parts = response.split('Глубокий анализ:');
              const mainPart = parts[0].trim();
              const analysisPart = parts[1].trim();
              
              // Извлекаем магические атрибуты из основной части
              const magicMatch = mainPart.match(/Магические атрибуты дня:\s*Число дня: (\d+)\s*Цвет дня: (.+)\s*Талисман: (.+)/s);
              if (magicMatch) {
                const [, number, color, talisman] = magicMatch;
                setMagicAttributes({ number, color, talisman });
                
                // Убираем магические атрибуты из основного прогноза
                const cleanMainPart = mainPart.replace(/Магические атрибуты дня:.*?(?=Глубокий анализ:|$)/s, '').trim();
                setDailyPrediction(cleanMainPart);
              } else {
                setDailyPrediction(mainPart);
              }
              
              setExtendedPrediction('Глубокий анализ: ' + analysisPart);
            } else {
              setDailyPrediction(response);
            }
          } catch (error) {
            console.error('Error getting horoscope:', error);
            setDailyPrediction("Звёзды предсказывают тебе день наполненный возможностями.");
          }
        }
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const getExtendedPrediction = async () => {
    if (isPremium) {
      // Premium пользователи уже видят расширенный прогноз
      return;
    } else {
      router.push('/energy');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#24243e']} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Здравствуй, {userProfile?.display_name || 'Странник'}!</Text>
            <Text style={styles.zodiacText}>{userProfile?.zodiac_sign || 'Таинственный знак'}</Text>
          </View>
          <View style={styles.zodiacBadge}>
            <Ionicons name="star" size={24} color="#ffd700" />
          </View>
        </View>

        {/* ENERGY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Энергия дня</Text>
          
          <EnergyItem label="Любовь" progress={0.85} color="#FF6B6B" />
          <EnergyItem label="Сила" progress={0.60} color="#FFD93D" />
          <EnergyItem label="Мудрость" progress={0.75} color="#6BCBFF" />
        </View>

        {/* MAGIC ATTRIBUTES CARD */}
        <View style={styles.magicCard}>
          <Text style={styles.cardTitle}>Магические атрибуты дня</Text>
          
          <View style={styles.magicRow}>
            <View style={[styles.magicBadge, !isPremium && styles.magicBadgeLocked]}>
              <Ionicons name="flash-outline" size={20} color={isPremium ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeText, !isPremium && styles.magicBadgeTextLocked]}>
                {isPremium && magicAttributes ? magicAttributes.number : "?"}
              </Text>
            </View>
            
            <View style={[styles.magicBadge, !isPremium && styles.magicBadgeLocked]}>
              <Ionicons name="color-palette-outline" size={20} color={isPremium ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeText, !isPremium && styles.magicBadgeTextLocked]}>
                {isPremium && magicAttributes ? magicAttributes.color : "?"}
              </Text>
            </View>
            
            <View style={[styles.magicBadge, !isPremium && styles.magicBadgeLocked]}>
              <Ionicons name="diamond-outline" size={20} color={isPremium ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeText, !isPremium && styles.magicBadgeTextLocked]}>
                {isPremium && magicAttributes ? magicAttributes.talisman : "?"}
              </Text>
            </View>
          </View>
          
          {!isPremium && (
            <Text style={styles.magicLockedText}>
              <Ionicons name="lock-closed" size={14} color="rgba(255, 215, 0, 0.5)" />
              <Text style={styles.magicLockedTextInner}>Доступно в Premium</Text>
            </Text>
          )}
        </View>

        {/* FORECAST CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={20} color="#ffd700" />
            <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 10 }]}>
              {isPremium ? "Твой полный прогноз" : "Прогноз дня"}
            </Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="crown" size={16} color="#ffd700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.forecastText}>
            {dailyPrediction}
          </Text>
          
          {/* Расширенный прогноз для Premium */}
          {isPremium && extendedPrediction && (
            <View style={styles.extendedSection}>
              <View style={styles.divider} />
              <Text style={styles.extendedText}>
                {extendedPrediction.replace('Глубокий анализ:', '').trim()}
              </Text>
            </View>
          )}
        </View>

        {/* CTA BUTTON - только для не-Premium */}
        {!isPremium && (
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={getExtendedPrediction}
          >
            <LinearGradient 
              colors={['#8E2DE2', '#4A00E0']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.buttonGradient}
            >
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Получить глубокий разбор</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// Вспомогательный компонент для шкал
const EnergyItem = ({ label, progress, color }: any) => (
  <View style={styles.energyRow}>
    <View style={styles.energyLabelRow}>
      <Text style={styles.energyLabel}>{label}</Text>
      <Text style={styles.energyPercent}>{Math.round(progress * 100)}%</Text>
    </View>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30 
  },
  greeting: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  zodiacText: { fontSize: 18, color: '#ffd700', marginTop: 4, fontWeight: '500', opacity: 0.9 },
  zodiacBadge: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255, 215, 0, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)'
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 15, opacity: 0.8 },
  
  energyRow: { marginBottom: 16 },
  energyLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  energyLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 },
  energyPercent: { color: '#fff', fontSize: 14, fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  forecastText: { 
    fontSize: 15, 
    lineHeight: 24, 
    color: 'rgba(255, 255, 255, 0.85)', 
    fontWeight: '400' 
  },

  mainButton: { 
    marginTop: 10,
    borderRadius: 30,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  buttonGradient: { 
    flexDirection: 'row', 
    height: 60, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  
  // Premium стили
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginVertical: 16,
  },
  extendedSection: {
    marginTop: 16,
  },
  extendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
    marginBottom: 12,
    textAlign: 'center',
  },
  extendedText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    fontStyle: 'italic',
  },

  // Магические атрибуты
  magicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  magicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  magicBadge: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 4,
  },
  magicBadgeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 215, 0, 0.15)',
    opacity: 0.6,
  },
  magicBadgeText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  magicBadgeTextLocked: {
    color: 'rgba(255, 215, 0, 0.4)',
  },
  magicLockedText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  magicLockedTextInner: {
    color: 'rgba(255, 215, 0, 0.5)',
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  }
});