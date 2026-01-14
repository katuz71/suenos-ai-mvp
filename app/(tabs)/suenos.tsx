import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Modal, RefreshControl, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../../src/hooks/useMonetization';
import { interpretDream } from '../../src/services/openai';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFocusEffect } from '@react-navigation/native';

interface DreamEntry {
  id: string;
  dream_text: string;
  interpretation_text: string;
  created_at: string;
}

export default function SuenosScreen() {
  const router = useRouter();
  const { credits, hasPremium, refreshStatus } = useMonetization();
  
  // Данные пользователя
  const [userName, setUserName] = useState<string | null>(null);
  const [userZodiac, setUserZodiac] = useState('');

  // Состояния ввода
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Состояния истории
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Состояния модального окна
  const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // АНИМАЦИЯ БЕЙДЖА ЭНЕРГИИ
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Отслеживаем изменения кредитов для анимации
  useEffect(() => {
    // Запускаем анимацию при изменении credits
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [credits]);

  // --- 1. ЗАГРУЗКА ДАННЫХ ---
  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingHistory(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Получаем профиль (Имя и Знак)
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, zodiac_sign')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserName(profile.display_name);
        setUserZodiac(profile.zodiac_sign || '');
      }

      // Получаем историю снов
      const { data: history } = await supabase
        .from('interpretations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      setDreamHistory(history || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  // Первичная загрузка
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Обновление при фокусе
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
      loadData(false);
    }, [refreshStatus, loadData])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
    refreshStatus();
  }, [loadData, refreshStatus]);

  // --- 2. ТОЛКОВАНИЕ СНА ---
  const handleInterpret = async () => {
    if (!dreamText.trim()) {
      Alert.alert("Луна ждет...", "Опиши свой сон, чтобы начать толкование.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, credits')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Проверка баланса
      if (!profile.is_premium && profile.credits < 1) {
        Alert.alert(
          "Недостаточно энергии", 
          "Для расшифровки нужна энергия или статус Premium.",
          [
            { text: "Отмена", style: "cancel" },
            { text: "Пополнить", onPress: () => router.push('/energy') }
          ]
        );
        return;
      }

      // ИИ запрос
      const response = await interpretDream(dreamText, {
        name: userName,
        zodiac: userZodiac
      });
      
      // Списание
      if (!profile.is_premium) {
        await supabase.rpc('consume_credit', { user_id: user.id });
      }
      
      // Сохранение
      await supabase.from('interpretations').insert({
        user_id: user.id,
        dream_text: dreamText,
        interpretation_text: response,
        created_at: new Date().toISOString()
      });
      
      await refreshStatus();
      await loadData(false);
      
      setResult(response);
      setDreamText('');
      
    } catch (e) {
      console.error(e);
      Alert.alert("Ошибка", "Не удалось получить толкование.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. РАБОТА С ДНЕВНИКОМ ---
  const handleOpenDream = (dream: DreamEntry) => {
    console.log("Opening dream:", dream.id); // Для отладки
    setSelectedDream(dream);
    setModalVisible(true);
  };

  const handleDeleteDream = (id: string) => {
    Alert.alert(
      "Удалить запись?",
      "Восстановить сон будет невозможно.",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase.from('interpretations').delete().eq('id', id);
              if (error) throw error;
              
              // Успешное удаление
              setModalVisible(false);
              setSelectedDream(null);
              loadData(false); // Обновляем список
            } catch (e) {
              console.error(e);
              Alert.alert("Ошибка", "Не удалось удалить запись. Проверьте интернет.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#1a1a2e']} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffd700" />}
      >
        {/* Хедер (ВЕРНУЛИ ИМЯ!) */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            {userName ? (
              <>
                <Text style={styles.greeting}>Здравствуй, {userName}!</Text>
                <Text style={styles.zodiac}>{userZodiac || 'Сновидец'}</Text>
              </>
            ) : (
              <View style={{ height: 50, justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#FFD700" />
              </View>
            )}
          </View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity onPress={() => router.push('/energy')} style={styles.energyBadge}>
              <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={styles.energyText}>{hasPremium ? '∞' : credits}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Форма ввода */}
        <View style={styles.magicCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={20} color="#ffd700" />
            <Text style={styles.cardTitle}>НОВОЕ ВИДЕНИЕ</Text>
          </View>
          <TextInput
            style={styles.dreamInput}
            placeholder="Что тебе приснилось сегодня?"
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
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
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

        {/* Результат */}
        {result && (
          <View style={styles.revelationCard}>
            <View style={styles.revelationHeader}>
              <Ionicons name="moon" size={24} color="#ffd700" />
              <Text style={styles.revelationTitle}>ОТКРОВЕНИЕ</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.revelationText}>{result}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
        
        {/* Заголовок Дневника */}
        <View style={styles.diaryHeader}>
          <Ionicons name="book-outline" size={20} color="#ffd700" />
          <Text style={styles.diaryTitle}>ДНЕВНИК СНОВ</Text>
          <View style={styles.diaryCount}>
            <Text style={styles.diaryCountText}>{dreamHistory.length}</Text>
          </View>
        </View>
        
        {/* Список истории (КЛИКАБЕЛЬНЫЙ) */}
        {loadingHistory ? (
          <ActivityIndicator size="small" color="#ffd700" style={{ marginTop: 20 }} />
        ) : dreamHistory.length > 0 ? (
          <View style={styles.diaryList}>
            {(() => {
              let lastMonth = '';
              return dreamHistory.map((item) => {
                const date = new Date(item.created_at);
                const month = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase();
                const showHeader = month !== lastMonth;
                lastMonth = month;
                
                return (
                  <React.Fragment key={item.id}>
                    {showHeader && <Text style={styles.monthHeader}>{month}</Text>}
                    <TouchableOpacity 
                      style={styles.dreamItem} 
                      activeOpacity={0.6}
                      onPress={() => handleOpenDream(item)} 
                    >
                      <View style={styles.dreamItemHeader}>
                        <Text style={styles.dreamItemDate}>{formatDate(item.created_at)}</Text>
                        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                      </View>
                      <Text style={styles.dreamItemText} numberOfLines={2}>
                        {item.dream_text}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              });
            })()}
          </View>
        ) : (
          <View style={styles.diaryEmpty}>
            <Text style={styles.diaryEmptyText}>История пуста</Text>
          </View>
        )}
      </ScrollView>

      {/* --- МОДАЛЬНОЕ ОКНО (FIXED LAYOUT) --- */}
      <Modal
// ...
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* 1. ШАПКА: Дата и Крестик */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalDate}>
                {selectedDream ? formatDate(selectedDream.created_at) : 'Загрузка...'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* 2. КОНТЕНТ (ScrollView с flex: 1) */}
            <ScrollView 
              style={{ flex: 1, width: '100%' }} 
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Секция: ТВОЙ СОН */}
              <Text style={styles.modalSectionTitle}>ТВОЙ СОН</Text>
              <View style={styles.modalDreamBox}>
                <Text style={styles.modalDreamText}>
                  {selectedDream?.dream_text ? selectedDream.dream_text : "Текст сна отсутствует в записи."}
                </Text>
              </View>
              {/* Секция: ТОЛКОВАНИЕ */}
              <Text style={styles.modalSectionTitle}>ТОЛКОВАНИЕ</Text>
              <View style={styles.modalInterpretationBox}>
                <Text style={styles.modalInterpretationText}>
                  {selectedDream?.interpretation_text ? selectedDream.interpretation_text : "Толкование не найдено."}
                </Text>
              </View>
            </ScrollView>

            {/* 3. ФУТЕР: Кнопка удаления */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => selectedDream && handleDeleteDream(selectedDream.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4444" style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>Удалить запись</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  
  // Хедер
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  zodiac: { fontSize: 18, color: '#ffd700', marginTop: 4, fontWeight: '500', opacity: 0.9 },
  energyBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    marginTop: -20
  },
  energyText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },

  // Карточки
  magicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', opacity: 0.8, marginLeft: 10 },
  dreamInput: { 
    color: '#fff', fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12,
  },
  mainButton: { borderRadius: 30, overflow: 'hidden' },
  buttonGradient: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Результат
  revelationCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)', borderRadius: 24, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  revelationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  revelationTitle: { fontSize: 18, fontWeight: '700', color: '#ffd700', marginLeft: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255, 215, 0, 0.2)', marginVertical: 10 },
  revelationText: { fontSize: 15, lineHeight: 24, color: '#fff', fontStyle: 'italic' },

  // Дневник
  diaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  diaryTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 10, flex: 1 },
  diaryCount: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  diaryCountText: { color: '#ffd700', fontSize: 14, fontWeight: '600' },
  diaryList: { paddingBottom: 20 },
  dreamItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dreamItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dreamItemDate: { fontSize: 12, color: '#ffd700', fontWeight: '500' },
  dreamItemText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 20 },
  diaryEmpty: { alignItems: 'center', padding: 20 },
  diaryEmptyText: { color: 'rgba(255,255,255,0.3)' },
  
  // Заголовки месяцев в дневнике
  monthHeader: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 10,
    opacity: 0.8
  },

  // МОДАЛКА
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: '#151520', 
    borderRadius: 24, 
    height: '80%', // Фиксированная высота, чтобы ScrollView имел место
    width: '100%',
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.15)', padding: 20,
    display: 'flex', flexDirection: 'column'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalDate: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalSectionTitle: { fontSize: 12, color: '#ffd700', fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 10 },
  
  // Явные стили для блоков текста
  modalDreamBox: { 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 50
  },
  modalDreamText: { fontSize: 16, color: '#ffffff', lineHeight: 24 },
  
  modalInterpretationBox: {
    marginTop: 5,
    padding: 5
  },
  modalInterpretationText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 24, fontStyle: 'italic' },
  
  deleteButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    marginTop: 10, paddingVertical: 15, 
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' 
  },
  deleteButtonText: { color: '#FF4444', fontSize: 16, fontWeight: '600' }
});