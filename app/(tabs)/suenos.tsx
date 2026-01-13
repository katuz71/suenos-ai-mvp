import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/services/supabase';
import { interpretDream } from '../../src/services/openai';
import { useRouter } from 'expo-router';
import { useMonetization } from '../../src/hooks/useMonetization';
import { useFocusEffect } from '@react-navigation/native';

interface UserProfile {
  display_name: string;
  zodiac_sign: string;
}

interface DreamHistory {
  id: string;
  dream_text: string;
  interpretation_text: string;
  created_at: string;
}

export default function SuenosScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamHistory[]>([]);
  const [selectedDream, setSelectedDream] = useState<DreamHistory | null>(null);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // 💰 ПОДКЛЮЧАЕМ МОНЕТИЗАЦИЮ
  const { 
    credits, 
    isPremium, 
    consumeCredit, 
    showAd, 
    loading: monetizationLoading,
    checkDailyEnergy,
    refreshStatus
  } = useMonetization();

  // 🔄 СИНХРОНИЗАЦИЯ ПРИ ФОКУСЕ НА ВКЛАДКУ
  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        console.log("🔄 [FOCUS] Синхронизация статуса во вкладке Снов");
        await refreshStatus();
      };
      refresh();
    }, [refreshStatus])
  );

  useEffect(() => {
    const initializeApp = async () => {
      await fetchProfile();
      await fetchHistory();
      
      // Проверяем ежедневное пополнение энергии
      const energyGifted = await checkDailyEnergy();
      if (energyGifted) {
        // Добавляем мистическое уведомление о начислении энергии
        setTimeout(() => {
          const giftMessage = {
            id: (Date.now()).toString(),
            text: "✨ Звезды наполнили ваш кристалл энергией. Новый день — новая мудрость снов.",
            sender: 'luna' as const
          };
          setMessages(prev => [...prev, giftMessage]);
        }, 1000);
      }
    };
    
    initializeApp();
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

        const name = data?.display_name || 'Странник';
        const sign = data?.zodiac_sign || 'Таинственный знак';
        
        setUserProfile({ display_name: name, zodiac_sign: sign });
        
        // Синхронизация знака зодиака с AsyncStorage
        if (data?.zodiac_sign) {
          const storedZodiac = await AsyncStorage.getItem('user_zodiac');
          if (!storedZodiac) {
            console.log("🔄 [SYNC] Сохраняем знак зодиака в AsyncStorage:", data.zodiac_sign);
            await AsyncStorage.setItem('user_zodiac', data.zodiac_sign);
          }
        }
        
        setMessages([{
            id: 'init',
            text: `Приветствую, ${name}. Вижу, твой знак — ${sign}. Я готова толковать твои сны.`,
            sender: 'luna'
        }]);
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('interpretations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        setDreamHistory(data || []);
        console.log(' Dream history loaded:', data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching dream history:', error);
    }
  };

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

  const handleDreamPress = (dream: DreamHistory) => {
    setSelectedDream(dream);
    setShowDreamModal(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    console.log(" [DEBUG] handleSend started");
    console.log(" [DEBUG] Current credits:", credits);
    console.log(" [DEBUG] Is premium:", isPremium);
    console.log("🚀 [DEBUG] handleSend started");
    console.log("🚀 [DEBUG] Current credits:", credits);
    console.log("🚀 [DEBUG] Is premium:", isPremium);
    
    // ПРОВЕРКА ЭНЕРГИИ
    // 1️⃣ ПРОВЕРКА ЭНЕРГИИ
    const hasAccess = await consumeCredit();
    console.log("🚀 [DEBUG] consumeCredit returned:", hasAccess);

    if (!hasAccess) {
      console.log("❌ [DEBUG] No energy, redirecting to energy screen...");
      router.push('/energy');
      return;
    }

    console.log("✅ [DEBUG] Access granted, proceeding with OpenAI API");

    // ✅ ДОСТУП РАЗРЕШЕН -> ЗАПУСКАЕМ МАГИЮ
    const userText = input;
    const userMsg = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Получаем знак зодиака - приоритет профилю Supabase
      const zodiacFromProfile = userProfile?.zodiac_sign;
      const zodiacFromStore = await AsyncStorage.getItem('user_zodiac');
      const finalZodiac = zodiacFromProfile || zodiacFromStore;
      
      console.log("🔮 [DEBUG] Профиль из Supabase:", userProfile);
      console.log("🔮 [DEBUG] Знак из профиля:", zodiacFromProfile);
      console.log("🔮 [DEBUG] Знак из AsyncStorage:", zodiacFromStore);
      console.log("🔮 [DEBUG] Финальный знак зодиака:", finalZodiac);
      
      // Вызываем реальный OpenAI API
      const aiResponse = await interpretDream(userText, {
        mode: 'dream',
        userContext: {
          zodiac: finalZodiac || undefined,
          name: userProfile?.display_name || undefined
        }
      });

      const lunaMsg = { 
        id: (Date.now()+1).toString(), 
        text: aiResponse, 
        sender: 'luna' 
      };
      setMessages(prev => [...prev, lunaMsg]);

      // Сохраняем толкование в базу данных
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('interpretations').insert({
            user_id: user.id,
            dream_text: userText,
            interpretation_text: aiResponse,
            created_at: new Date().toISOString()
          });
          console.log('📝 Interpretation saved to database');
          
          // Обновляем историю после сохранения
          await fetchHistory();
        }
      } catch (saveError) {
        console.error('Error saving interpretation:', saveError);
      }

    } catch (error) {
      console.error('OpenAI Error:', error);
      
      // Показываем пользователю понятную ошибку
      const errorMessage = error instanceof Error ? error.message : 'Связь с астралом прервана... Попробуй позже.';
      
      const errorMsg = { 
        id: (Date.now()+1).toString(), 
        text: errorMessage,
        sender: 'luna' 
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Дополнительно показываем ошибку для критических проблем подключения
      if (error instanceof Error && error.message.includes('configurada')) {
        const errorMsg = { 
          id: (Date.now()+2).toString(), 
          text: "Ошибка подключения к космосу. Проверьте интернет и попробуйте снова.",
          sender: 'luna' 
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          {/* ✨ ИНДИКАТОР КРЕДИТОВ (Слева сверху) */}
          {!monetizationLoading && (
            <TouchableOpacity 
              style={styles.creditBadge}
              onPress={() => !isPremium && router.push('/energy')}
            >
              {isPremium ? (
                <Ionicons name="infinite" size={20} color="#A855F7" />
              ) : (
                <>
                  <Text style={styles.creditText}>{credits}</Text>
                  <Ionicons name="sparkles" size={16} color="#A855F7" />
                </>
              )}
            </TouchableOpacity>
          )}
          
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={styles.headerTitle}>Sueños</Text>
            <Text style={styles.headerSubtitle}>Luna - Guía Onírica</Text>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={{color: '#64748B', marginTop: 10}}>Связь с космосом...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.bubble, 
                item.sender === 'user' ? styles.userBubble : styles.lunaBubble
              ]}>
                <Text style={styles.msgText}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Луна слушает звезды...</Text>
          </View>
        )}

        {/* ИСТОРИЯ СНОВ */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>История твоих снов</Text>
          
          {dreamHistory.length > 0 ? (
            <FlatList
              data={dreamHistory}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.dreamCard}
                  onPress={() => handleDreamPress(item)}
                >
                  <View style={styles.dreamCardHeader}>
                    <Ionicons name="moon-outline" size={20} color="#A855F7" />
                    <Text style={styles.dreamDate}>{formatDate(item.created_at)}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </View>
                  <Text style={styles.dreamPreview}>
                    {item.dream_text.length > 50 
                      ? item.dream_text.substring(0, 50) + '...' 
                      : item.dream_text}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.historyListContent}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="book-outline" size={48} color="#64748B" />
              <Text style={styles.emptyHistoryText}>
                Твоя книга снов пока пуста. Расскажи Луне о своем первом видении
              </Text>
            </View>
          )}
        </View>

        {/* МОДАЛЬНОЕ ОКНО СНА */}
        {showDreamModal && selectedDream && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Толкование сна</Text>
                <TouchableOpacity onPress={() => setShowDreamModal(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Твой сон</Text>
                <Text style={styles.modalDreamText}>{selectedDream.dream_text}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Разбор Луны</Text>
                <Text style={styles.modalInterpretationText}>{selectedDream.interpretation_text}</Text>
              </View>
              
              <View style={styles.modalFooter}>
                <Text style={styles.modalDate}>{formatDate(selectedDream.created_at)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Опиши свой сон..."
            placeholderTextColor="#64748B"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Ionicons name="arrow-up" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  keyboardContainer: { flex: 1 },
  header: {
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#A855F7', marginTop: 2 },
  logoutBtn: { width: 40, alignItems: 'flex-end' },
  
  // Стили для бейджа кредитов
  creditBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(168, 85, 247, 0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(168, 85, 247, 0.3)' 
  },
  creditText: { color: '#A855F7', fontWeight: 'bold', marginRight: 5, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 10 },
  bubble: { padding: 16, borderRadius: 20, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#7C3AED', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  lunaBubble: { backgroundColor: '#1E293B', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { color: '#F1F5F9', fontSize: 16, lineHeight: 22 },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingText: {
    color: '#A855F7',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#F8FAFC',
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#A855F7',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 4, 
  },

  // Стили для истории снов
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  dreamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dreamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dreamDate: {
    flex: 1,
    fontSize: 14,
    color: '#A855F7',
    marginLeft: 12,
    fontWeight: '500',
  },
  dreamPreview: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  historyListContent: {
    paddingBottom: 0,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },

  // Стили для модального окна
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A855F7',
    marginBottom: 8,
  },
  modalDreamText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  modalInterpretationText: {
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 22,
  },
  modalFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalDate: {
    fontSize: 14,
    color: '#64748B',
  },
});