import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Alert, LayoutAnimation, Share, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';
import { generateDailyHoroscope } from '../../src/services/openai';
import AdBanner from '../../src/components/AdBanner';
import MagicAlert from '../../src/components/MagicAlert';

const { width } = Dimensions.get('window');

const generateDailyAttributes = (sign: string) => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  
  // Уникальное число дня с учетом знака зодиака
  const zodiacIndex = 'ОвенТелецБлизнецыРакЛевДеваВесыСкорпионСтрелецКозеродВодолейРыбы'.indexOf(sign);
  const seed = day + month + year + zodiacIndex;
  
  const colors = ['Красный', 'Синий', 'Золотой', 'Зеленый', 'Фиолетовый', 'Оранжевый', 'Бирюзовый', 'Розовый'];
  const talismans = ['Рубин', 'Сапфир', 'Агат', 'Лунный камень', 'Янтарь', 'Аметист', 'Горный хрусталь', 'Обсидиан'];
  
  // Генерируем предсказуемые случайные значения на основе даты и знака
  const random = (multiplier: number, offset: number) => {
    const x = Math.sin(seed * multiplier) * 10000;
    return Math.floor((x - Math.floor(x)) * 100) + offset;
  };
  
  return {
    // Энергия дня (0-100%)
    love: Math.min(95, Math.max(15, random(123, 0))),      // Любовь: 15-95%
    power: Math.min(95, Math.max(15, random(456, 0))),     // Сила: 15-95%
    wisdom: Math.min(95, Math.max(15, random(789, 0))),    // Мудрость: 15-95%
    
    // Магические атрибуты
    number: random(111, 1).toString(),                      // Число: 1-99
    color: colors[random(222, 0) % colors.length],          // Цвет из массива
    talisman: talismans[random(333, 0) % talismans.length] // Талисман из массива
  };
};

// Вспомогательный компонент для шкал
const EnergyItem = ({ label, progress, color, value }: any) => (
  <View style={styles.energyRow}>
    <View style={styles.energyLabelRow}>
      <Text style={styles.energyLabel}>{label}</Text>
      <Text style={styles.energyPercent}>{value || Math.round(progress * 100)}%</Text>
    </View>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

export default function HoroscopeScreen() {
  const router = useRouter();
  const { isPremium, refreshStatus, credits } = useMonetization();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyPrediction, setDailyPrediction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [extendedPrediction, setExtendedPrediction] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEnergyAlert, setShowEnergyAlert] = useState(false);

  // Premium пользователи видят всё сразу
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
      if (isPremium) {
        setIsUnlocked(true);
      }
      // Загружаем профиль и гороскоп при фокусе
      loadProfileAndHoroscope();
    }, [])
  );

  // Генерируем атрибуты на основе знака зодиака и текущей даты
  const generatedAttributes = useMemo(() => {
    if (userProfile?.zodiac_sign) {
      return generateDailyAttributes(userProfile.zodiac_sign);
    }
    return null;
  }, [userProfile?.zodiac_sign]);

  // Используем сгенерированные атрибуты или полученные от ИИ
  const magicAttributes = generatedAttributes || {
    number: "1",
    color: "Красный",
    talisman: "Рубин"
  };

  // Функция для очистки текста от Markdown-символов
  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*/g, "") // Убираем двойные звезды (жирный)
      .replace(/\*/g, "")   // Убираем одинарные звезды (списки)
      .replace(/#/g, "")    // Убираем решетки (заголовки)
      .trim();
  };

  const loadProfileAndHoroscope = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('display_name, zodiac_sign')
        .eq('id', user.id)
        .single();

      setUserProfile(data);
      
      // Загрузка прогноза с кэшированием
      if (data?.zodiac_sign) {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const storageKey = `horoscope_${dateKey}_${user.id}`;
        
        try {
          // Сначала проверяем AsyncStorage
          const cachedHoroscope = await AsyncStorage.getItem(storageKey);
          
          if (cachedHoroscope) {
            // Если есть кэш - показываем мгновенно
            setDailyPrediction(cachedHoroscope);
            setLoading(false);
          } else {
            // Если нет кэша - показываем лоадер и генерируем
            setIsLoading(true);
            setLoading(false);
            
            const response = await generateDailyHoroscope(
              data.zodiac_sign, 
              data.display_name || 'Странник'
            );
            
            setDailyPrediction(response);
            
            // Сохраняем в AsyncStorage
            await AsyncStorage.setItem(storageKey, response);
          }
        } catch (error) {
          console.error('Error getting horoscope:', error);
          setDailyPrediction("Звёзды предсказывают тебе день наполненный возможностями.");
        }
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    Keyboard.dismiss();
    
    // Проверяем баланс
    if (credits < 1) {
      setShowEnergyAlert(true);
      return;
    }

    // Списываем 1 кредит
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCredits = credits - 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) {
        console.error('Error decreasing credits:', error);
        Alert.alert('Ошибка', 'Не удалось списать энергию');
        return;
      }

      // Обновляем статус и разблокируем с анимацией
      await refreshStatus();
      
      // Настраиваем анимацию перед разблокировкой
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsUnlocked(true);
      
    } catch (error) {
      console.error('Error in handleUnlock:', error);
      Alert.alert('Ошибка', 'Что-то пошло не так');
    }
  };

  // --- ПОДЕЛИТЬСЯ ГОРОСКОПОМ ---
  const handleShare = async () => {
    if (!dailyPrediction) return;
    
    try {
      await Share.share({
        message: `🌟 Гороскоп на сегодня для ${userProfile?.zodiac_sign || 'всех знаков'}:\n\n${dailyPrediction}\n\n✨ Предсказано в Suenos AI - Мистический гороскоп`,
        url: 'https://suenos-ai.app'
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#24243e']} style={StyleSheet.absoluteFill} />
      
      {/* UI ЗАГРУЗКИ */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>Составляем карту дня...</Text>
        </View>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            {userProfile ? (
              <>
                <Text style={styles.greeting}>Здравствуй, {userProfile.display_name || 'Странник'}!</Text>
                <Text style={styles.zodiacText}>{userProfile.zodiac_sign || 'Таинственный знак'}</Text>
              </>
            ) : (
              <View style={{ height: 50, justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#FFD700" />
              </View>
            )}
          </View>
          
          {/* КЛИКАБЕЛЬНЫЙ БЕЙДЖ ЭНЕРГИИ */}
          <TouchableOpacity 
            onPress={() => router.push('/energy')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,215,0,0.3)',
              marginTop: -20
            }}
          >
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
              {isPremium ? '∞' : credits}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ENERGY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Энергия дня</Text>
          
          <EnergyItem 
            label="Любовь" 
            progress={generatedAttributes ? generatedAttributes.love / 100 : 0.85} 
            color="#FF6B6B" 
            value={generatedAttributes ? generatedAttributes.love : 85}
          />
          <EnergyItem 
            label="Сила" 
            progress={generatedAttributes ? generatedAttributes.power / 100 : 0.60} 
            color="#FFD93D" 
            value={generatedAttributes ? generatedAttributes.power : 60}
          />
          <EnergyItem 
            label="Мудрость" 
            progress={generatedAttributes ? generatedAttributes.wisdom / 100 : 0.75} 
            color="#6BCBFF" 
            value={generatedAttributes ? generatedAttributes.wisdom : 75}
          />
        </View>

        {/* MAGIC ATTRIBUTES CARD */}
        <View style={styles.magicCard}>
          <Text style={styles.cardTitle}>Магические атрибуты дня</Text>
          
          <View style={styles.magicRow}>
            <View style={[styles.magicBadge, (!isPremium && !isUnlocked) && styles.magicBadgeLocked]}>
              <Ionicons name="flash-outline" size={20} color={(isPremium || isUnlocked) ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeValue, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                {(isPremium || isUnlocked) ? magicAttributes.number : "?"}
              </Text>
              <Text style={[styles.magicBadgeLabel, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                Число
              </Text>
            </View>
            
            <View style={[styles.magicBadge, (!isPremium && !isUnlocked) && styles.magicBadgeLocked]}>
              <Ionicons name="color-palette-outline" size={20} color={(isPremium || isUnlocked) ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeValue, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                {(isPremium || isUnlocked) ? magicAttributes.color : "?"}
              </Text>
              <Text style={[styles.magicBadgeLabel, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                Цвет
              </Text>
            </View>
            
            <View style={[styles.magicBadge, (!isPremium && !isUnlocked) && styles.magicBadgeLocked]}>
              <Ionicons name="diamond-outline" size={20} color={(isPremium || isUnlocked) ? "#ffd700" : "rgba(255, 215, 0, 0.3)"} />
              <Text style={[styles.magicBadgeValue, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                {(isPremium || isUnlocked) ? magicAttributes.talisman : "?"}
              </Text>
              <Text style={[styles.magicBadgeLabel, (!isPremium && !isUnlocked) && styles.magicBadgeTextLocked]}>
                Талисман
              </Text>
            </View>
          </View>
          
          {(!isPremium && !isUnlocked) && (
            <Text style={styles.magicLockedText}>
              <Ionicons name="lock-closed" size={14} color="rgba(255, 215, 0, 0.5)" />
              <Text style={styles.magicLockedTextInner}>Доступно в Premium или после разблокировки</Text>
            </Text>
          )}
        </View>

        {/* FORECAST CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={20} color="#ffd700" />
            <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 10, flex: 1 }]}>
              {isPremium ? "Твой полный прогноз" : "Прогноз дня"}
            </Text>
            {dailyPrediction && (
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={24} color="#FFD700" />
              </TouchableOpacity>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#ffd700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          
          {/* КОНТЕЙНЕР С ТЕКСТОМ ПРОГНОЗА */}
          <View style={[styles.forecastContainer, !isUnlocked && styles.forecastContainerLocked]}>
            <Text style={styles.forecastText}>
              {/* ЗАМАНКА: показываем первые 150 символов если не разблокировано */}
              {(!isUnlocked && !isPremium && dailyPrediction) 
                ? cleanText(dailyPrediction).substring(0, 150) + '...' 
                : cleanText(dailyPrediction)}
            </Text>
            
            {/* СТЕНА ЭНЕРГИИ - если не разблокировано */}
            {!isUnlocked && !isPremium && dailyPrediction && (
              <>
                {/* Градиент для эффекта размытия */}
                <LinearGradient
                  colors={['transparent', '#0f0c29']}
                  locations={[0, 0.7]}
                  style={styles.forecastGradient}
                />
                
                {/* Кнопка разблокировки в центре градиента */}
                <View style={styles.unlockOverlay}>
                  <TouchableOpacity 
                    style={styles.unlockButton}
                    onPress={handleUnlock}
                  >
                    <LinearGradient
                      colors={['#FFB800', '#FF8C00']}
                      style={styles.unlockButtonGradient}
                    >
                      <Text style={[styles.unlockButtonText, { fontSize: 14 }]}>Открыть прогноз + Атрибуты</Text>
                      <Text style={styles.unlockButtonPrice}>(-1 энергия ✨)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          
          {/* Расширенный прогноз для Premium */}
          {isPremium && extendedPrediction && (
            <View style={styles.extendedSection}>
              <View style={styles.divider} />
              <Text style={styles.extendedText}>
                {cleanText(extendedPrediction.replace('Глубокий анализ:', '').trim())}
              </Text>
            </View>
          )}
        </View>

        {/* ЕДИНАЯ КНОПКА ДЕЙСТВИЯ - только если нет прогноза */}
        {!dailyPrediction && !loading && !isLoading && (
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={loadProfileAndHoroscope}
          >
            <LinearGradient 
              colors={['#8E2DE2', '#4A00E0']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.buttonGradient}
            >
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Получить предсказание</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* AdBanner - показываем только для не-Premium пользователей */}
        <AdBanner />
      </ScrollView>
      
      {/* MagicAlert для энергии */}
      <MagicAlert 
        visible={showEnergyAlert}
        title="Мало энергии"
        message="Для магии нужна энергия. Пополнить запасы?"
        icon="flash"
        confirmText="В магазин"
        cancelText="Позже"
        onConfirm={() => {
          setShowEnergyAlert(false);
          router.push('/energy');
        }}
        onCancel={() => setShowEnergyAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30 
  },
  headerTextContainer: { flex: 1 },
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
  shareButton: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1, 
    borderColor: 'rgba(255, 215, 0, 0.2)',
    marginLeft: 8
  },
  
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

  // СТЕНА ЭНЕРГИИ
  forecastContainer: {
    position: 'relative',
  },
  forecastContainerLocked: {
    maxHeight: 150,
    overflow: 'hidden',
  },
  forecastGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  unlockOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  unlockButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  unlockButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  unlockButtonPrice: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
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
  magicBadgeValue: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  magicBadgeLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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
  },

  // UI ЗАГРУЗКИ
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 12, 41, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  }
});