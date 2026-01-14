import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Dimensions, FlatList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../../src/hooks/useMonetization';
import { interpretDream } from '../../src/services/openai';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface DreamEntry {
  id: string;
  dream_text: string;
  interpretation_text: string;
  created_at: string;
}

export default function SuenosScreen() {
  const router = useRouter();
  const { credits, hasPremium, consumeCredit } = useMonetization();
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Загрузка истории снов
  const loadDreamHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('interpretations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setDreamHistory(data || []);
      }
    } catch (error) {
      console.error('Error loading dream history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Загрузка при фокусе на вкладку
  useFocusEffect(
    React.useCallback(() => {
      loadDreamHistory();
    }, [])
  );

  const handleInterpret = async () => {
    if (!dreamText.trim()) {
      Alert.alert("Луна ждет...", "Опиши свой сон, чтобы начать толкование.");
      return;
    }

    if (credits <= 0 && !hasPremium) {
      router.push('/energy');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await interpretDream(dreamText);
      if (!hasPremium) {
        await consumeCredit();
      }
      
      // Сохраняем в базу данных
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('interpretations').insert({
            user_id: user.id,
            dream_text: dreamText,
            interpretation_text: response,
            created_at: new Date().toISOString()
          });
          
          // Обновляем историю
          await loadDreamHistory();
        }
      } catch (saveError) {
        console.error('Error saving dream:', saveError);
      }
      
      setResult(response);
      setDreamText(''); // Очищаем поле ввода
    } catch (e) {
      Alert.alert("Ошибка", "Звезды сегодня туманны. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  // Рендер элемента дневника
  const renderDreamItem = ({ item }: { item: DreamEntry }) => (
    <TouchableOpacity style={styles.dreamItem}>
      <View style={styles.dreamItemHeader}>
        <Ionicons name="moon-outline" size={16} color="#ffd700" />
        <Text style={styles.dreamItemDate}>{formatDate(item.created_at)}</Text>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
      </View>
      <Text style={styles.dreamItemText} numberOfLines={2}>
        {item.dream_text}
      </Text>
      <Text style={styles.dreamItemPreview} numberOfLines={1}>
        {item.interpretation_text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#1a1a2e']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Премиальный хедер */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Здравствуй, Рома!</Text>
            <Text style={styles.zodiac}>Лев</Text>
          </View>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={24} color="#ffd700" />
          </View>
        </View>

        {/* Магическая карточка ввода */}
        <View style={styles.magicCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={20} color="#ffd700" />
            <Text style={styles.cardTitle}>ОПИШИ СВОЕ ВИДЕНИЕ</Text>
          </View>
          <TextInput
            style={styles.dreamInput}
            placeholder="Позволь Луне заглянуть в твои сны..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            value={dreamText}
            onChangeText={setDreamText}
          />
          <TouchableOpacity 
            style={[styles.mainButton, loading && { opacity: 0.7 }]} 
            onPress={handleInterpret}
            disabled={loading}
          >
            <LinearGradient 
              colors={['#8E2DE2', '#4A00E0']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.buttonText}>
                    {hasPremium ? 'ПОЛУЧИТЬ ОТКРОВЕНИЕ' : 'РАСШИФРОВАТЬ (-1 ✨)'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Блок откровения Луны */}
        {result && (
          <View style={styles.revelationCard}>
            <View style={styles.revelationHeader}>
              <Ionicons name="moon-stars" size={24} color="#ffd700" />
              <Text style={styles.revelationTitle}>ОТКРОВЕНИЕ ЛУНЫ</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.revelationText}>{result}</Text>
          </View>
        )}

        {/* Статус энергии */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="sparkles" size={16} color="#ffd700" />
            <Text style={styles.statusTitle}>СТАТУС ЭНЕРГИИ</Text>
          </View>
          <View style={styles.energyRow}>
            <Text style={styles.energyLabel}>Доступная энергия</Text>
            <Text style={styles.energyValue}>{credits} ✨</Text>
          </View>
          <View style={styles.progressBg}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: hasPremium ? '100%' : `${Math.min((credits / 5) * 100, 100)}%`,
                  backgroundColor: hasPremium ? '#ffd700' : '#8E2DE2'
                }
              ]} 
            />
          </View>
          {hasPremium && (
            <View style={[styles.premiumBadge]}>
              <Ionicons name="star" size={12} color="#ffd700" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
        <View style={{ height: 20 }} />
        {/* Дневник снов */}
        <React.Fragment>
          <View style={styles.diaryCard}>
            <View style={styles.diaryHeader}>
              <Ionicons name="book-outline" size={20} color="#ffd700" />
              <Text style={styles.diaryTitle}>ДНЕВНИК СНОВ</Text>
              <View style={styles.diaryCount}>
                <Text style={styles.diaryCountText}>{dreamHistory.length}</Text>
              </View>
            </View>
            
            {loadingHistory ? (
              <View style={styles.diaryLoading}>
                <ActivityIndicator size="small" color="#ffd700" />
                <Text style={styles.diaryLoadingText}>Загрузка дневника...</Text>
              </View>
            ) : dreamHistory.length > 0 ? (
              <FlatList
                data={dreamHistory}
                keyExtractor={item => item.id}
                renderItem={renderDreamItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.diaryList}
                nestedScrollEnabled={false}
              />
            ) : (
              <View style={styles.diaryEmpty}>
                <Ionicons name="moon-outline" size={48} color="rgba(255,215,0,0.3)" />
                <Text style={styles.diaryEmptyText}>
                  Твой дневник снов пока пуст. Расскажи Луне о своем первом видении
                </Text>
              </View>
            )}
          </View>
        </React.Fragment>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  // Премиальный хедер
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30 
  },
  greeting: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  zodiac: { fontSize: 18, color: '#ffd700', marginTop: 4, fontWeight: '500', opacity: 0.9 },
  starBadge: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255, 215, 0, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)'
  },

  // Магическая карточка ввода
  magicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 15, opacity: 0.8, marginLeft: 10 },
  dreamInput: { 
    color: '#fff', 
    fontSize: 18, 
    minHeight: 120, 
    textAlignVertical: 'top', 
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  // Градиентная кнопка
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

  // Карточка откровения
  revelationCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  revelationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  revelationTitle: { fontSize: 20, fontWeight: '700', color: '#ffd700', marginLeft: 10, letterSpacing: 1 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginVertical: 16,
  },
  revelationText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    fontStyle: 'italic',
  },

  // Статус энергии
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  energyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  energyLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 },
  energyValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Premium бейдж
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Дневник снов
  diaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  diaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  diaryCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  diaryCountText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
  diaryLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  diaryLoadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },
  diaryList: {
    paddingBottom: 0,
  },
  dreamItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dreamItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dreamItemDate: {
    flex: 1,
    fontSize: 14,
    color: '#ffd700',
    marginLeft: 8,
    fontWeight: '500',
  },
  dreamItemText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 6,
  },
  dreamItemPreview: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  diaryEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  diaryEmptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});