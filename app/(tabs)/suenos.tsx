import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, RefreshControl, Animated, Share, Keyboard, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../../src/hooks/useMonetization';
import { interpretDream } from '../../src/services/openai'; 
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MagicAlert from '../../src/components/MagicAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdBanner from '../../src/components/AdBanner';
import analytics from '@react-native-firebase/analytics';

// --- ИМПОРТ СЕРВИСА УВЕДОМЛЕНИЙ (НОВОЕ) ---
import { registerForPushNotificationsAsync, scheduleDailyReminder } from '../../src/services/NotificationService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DreamEntry {
  id: string;
  dream_text: string;
  interpretation_text: string;
  chat_history?: ChatMessage[]; 
  created_at: string;
}

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'luna';
  isDream?: boolean; 
};

type ScreenMode = 'input' | 'chat';

const BONUS_DATE_KEY = 'daily_bonus_date_v1';

export default function SuenosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { credits, isPremium, refreshStatus, spendEnergy, checkDailyBonus } = useMonetization();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const bonusCheckLock = useRef(false);

  const [userName, setUserName] = useState<string>('Viajero');
  const [userZodiac, setUserZodiac] = useState('');
  const [mode, setMode] = useState<ScreenMode>('input');
  const [currentDreamId, setCurrentDreamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dreamText, setDreamText] = useState(''); 
  const [chatInputText, setChatInputText] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false); 
  const [refreshing, setRefreshing] = useState(false);
  const [magicAlert, setMagicAlert] = useState({ visible: false, title: '', message: '', icon: '' });
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [dreamToDelete, setDreamToDelete] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Energy animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [credits]);

  // Chat autoscroll logic
  useEffect(() => {
    if (mode === 'chat') {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
    const kbdShow = Keyboard.addListener('keyboardDidShow', () => {
      if (mode === 'chat') setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => kbdShow.remove();
  }, [messages, mode, loading]);

  // --- UNIFIED BONUS LOGIC ---
  useEffect(() => {
    const handleBonuses = async () => {
      const name = await AsyncStorage.getItem('user_name');
      const sign = await AsyncStorage.getItem('user_zodiac');
      if (name) setUserName(name);
      if (sign) setUserZodiac(sign);

      if (bonusCheckLock.current) return;
      bonusCheckLock.current = true;

      if (params.welcome === 'true') {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(BONUS_DATE_KEY, today);

        setMagicAlert({
          visible: true,
          title: "¡Regalo Estelar! ✨",
          message: "Has recibido 3 energías para empezar.",
          icon: "star"
        });
        
        router.setParams({ welcome: '' });
      } else {
        setTimeout(async () => {
          if (checkDailyBonus) {
            const bonusGiven = await checkDailyBonus();
            if (bonusGiven) {
              setMagicAlert({
                visible: true,
                title: "¡Regalo Diario! 🎁",
                message: "Has recibido +1 energía por volver hoy.",
                icon: "star"
              });
            }
          }
        }, 1500);
      }
    };

    handleBonuses();
  }, [params.welcome]);

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (showLoading) setLoadingHistory(false);
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('display_name, zodiac_sign').eq('id', user.id).maybeSingle();
      if (profile) {
        setUserName(profile.display_name);
        setUserZodiac(profile.zodiac_sign || '');
        await AsyncStorage.setItem('user_name', profile.display_name || '');
      }

      const { data: history, error } = await supabase
        .from('interpretations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!error && history) setDreamHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      if (showLoading) setLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      analytics().logScreenView({
      screen_name: 'Sueños (Main)',
      screen_class: 'SuenosScreen',
    });
      const loadAndRefresh = async () => {
        if (!isActive) return;
        const shouldShowSpinner = dreamHistory.length === 0;
        await loadData(shouldShowSpinner);
        if (!isActive) return;
        refreshStatus();
      };
      loadAndRefresh();
      return () => { isActive = false; };
    }, [loadData]) 
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
    refreshStatus();
  }, [loadData, refreshStatus]);

  const handleOpenDream = (dream: DreamEntry) => {
    setCurrentDreamId(dream.id);
    const restoredMessages: Message[] = [
      { id: 'dream', text: dream.dream_text, sender: 'user', isDream: true },
      { id: 'luna-1', text: dream.interpretation_text, sender: 'luna' }
    ];
    if (dream.chat_history && Array.isArray(dream.chat_history)) {
      dream.chat_history.forEach((msg, index) => {
        restoredMessages.push({
          id: `hist-${index}`,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'luna'
        });
      });
    }
    setMessages(restoredMessages);
    setMode('chat');
  };

  const handleSendDream = async () => {
    Keyboard.dismiss();
    if (!dreamText.trim()) {
      setMagicAlert({ visible: true, title: "Luna escucha", message: "Cuéntame tu sueño primero.", icon: "moon" });
      return;
    }
    
    if (!isPremium && credits < 1) {
      setMagicAlert({ visible: true, title: "Poca Energía", message: "¿Recargar en la tienda?", icon: "flash" });
      return;
    }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!isPremium) {
        const success = await spendEnergy(1);
        if (!success) {
           setLoading(false);
           setMagicAlert({ visible: true, title: "Error", message: "Error de saldo. Intenta recargar.", icon: "flash" });
           return;
        }
      }

      const aiResponse = await interpretDream(dreamText, { name: userName, zodiac: userZodiac });
      
      const { data, error } = await supabase.from('interpretations').insert({
          user_id: user.id,
          dream_text: dreamText,
          interpretation_text: aiResponse,
          chat_history: [],
          created_at: new Date().toISOString()
        }).select().single();

      if (error) throw error;
      if (data) setCurrentDreamId(data.id);
      
      const msgDream: Message = { id: 'dream', text: dreamText, sender: 'user', isDream: true };
      const msgLuna: Message = { id: 'luna-1', text: aiResponse, sender: 'luna' };
      
      setMessages([msgDream, msgLuna]);
      setDreamText(''); 
      setMode('chat');
      loadData(false);

      // --- 🚀 SMART PUSH STRATEGY (НОВАЯ ЛОГИКА) ---
      // Спрашиваем разрешение только ПОСЛЕ того, как пользователь получил ценность (интерпретацию)
      setTimeout(async () => {
        try {
          // Эта функция сама проверит, есть ли права, и если нет — покажет системный диалог
          const token = await registerForPushNotificationsAsync();
          if (token) {
            // Если пользователь нажал "Разрешить", планируем напоминание
            await scheduleDailyReminder();
            console.log("Smart Push: Permission granted & reminder set.");
          }
        } catch (e) {
          console.log("Smart Push: Dialog skipped or failed", e);
        }
      }, 3500); // Задержка 3.5 секунды, пока пользователь читает ответ
      // ----------------------------------------------

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "La conexión cósmica falló.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!chatInputText.trim()) return;
    if (!isPremium && credits < 1) {
      setMagicAlert({ visible: true, title: "Poca Energía", message: "¿Recargar?", icon: "flash" });
      return;
    }

    const userMsgText = chatInputText;
    setChatInputText(''); 
    setLoading(true);

    try {
      if (!isPremium) {
         const success = await spendEnergy(1);
         if (!success) {
            setLoading(false);
            setMagicAlert({ visible: true, title: "Poca Energía", message: "¿Recargar?", icon: "flash" });
            return;
         }
      }

      const newUserMsg: Message = { id: Date.now().toString(), text: userMsgText, sender: 'user' };
      const newMessagesLocal = [...messages, newUserMsg];
      setMessages(newMessagesLocal);

      const contextString = messages.map(m => `${m.sender === 'user' ? 'USUARIO' : 'LUNA'}: ${m.text}`).join('\n');
      const fullPrompt = `HISTORIAL:\n${contextString}\nNUEVO:\n${userMsgText}\nResponde como Luna en Español.`;

      const aiReplyText = await interpretDream(fullPrompt, { name: userName, zodiac: userZodiac });
      
      const newLunaMsg: Message = { id: (Date.now() + 1).toString(), text: aiReplyText, sender: 'luna' };
      const finalMessages = [...newMessagesLocal, newLunaMsg];
      setMessages(finalMessages);

      if (currentDreamId) {
        const historyToSave = finalMessages.filter(m => m.id !== 'dream' && m.id !== 'luna-1').map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
        await supabase.from('interpretations').update({ chat_history: historyToSave }).eq('id', currentDreamId);
      }

    } catch (e) {
      Alert.alert("Error", "Magia interrumpida...");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInput = () => {
    setMode('input');
    setMessages([]);
    setCurrentDreamId(null);
    loadData(false); 
  };

  const handleConfirmDelete = (id: string) => {
    setDreamToDelete(id);
    setDeleteAlertVisible(true);
  };

  const performDelete = async () => {
    if (!dreamToDelete) return;
    try {
      await supabase.from('interpretations').delete().eq('id', dreamToDelete);
      setDeleteAlertVisible(false);
      setDreamToDelete(null);
      loadData(false); 
    } catch (e) { Alert.alert("Error", "Error al borrar."); }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#1a1a2e']} style={StyleSheet.absoluteFill} />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
        <View style={styles.headerTextContainer}>
          {mode === 'chat' ? (
            <TouchableOpacity onPress={handleBackToInput} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-back" size={24} color="#FFD700" />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
          ) : (
             <Text style={styles.greeting}>¡Hola, {userName}!</Text>
          )}
        </View>
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity onPress={() => router.push('/energy')} style={styles.energyBadge}>
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.energyText}>{isPremium ? '∞' : credits}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* CONTENT AREA */}
      <View style={{ flex: 1 }}>
        {mode === 'input' && (
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffd700" />}
          >
            <View style={styles.magicCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="moon-outline" size={20} color="#ffd700" />
                <Text style={styles.cardTitle}>NUEVA VISIÓN</Text>
              </View>
              <TextInput
                style={styles.dreamInput}
                placeholder="¿Qué soñaste hoy? Cuéntamelo..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                value={dreamText}
                onChangeText={setDreamText}
              />
              <TouchableOpacity 
                style={[styles.mainButton, loading && { opacity: 0.7 }]} 
                onPress={handleSendDream}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#8E2DE2', '#4A00E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 10 }} />
                      <Text style={styles.buttonText}>{isPremium ? 'INTERPRETAR' : 'INTERPRETAR (-1 ✨)'}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
            
            <View style={styles.diaryHeader}>
              <Ionicons name="book-outline" size={20} color="#ffd700" />
              <Text style={styles.diaryTitle}>DIARIO DE SUEÑOS</Text>
              <View style={styles.diaryCount}><Text style={styles.diaryCountText}>{dreamHistory.length}</Text></View>
            </View>
            
            {loadingHistory ? (
              <ActivityIndicator size="small" color="#ffd700" style={{ marginTop: 20 }} />
            ) : dreamHistory.length > 0 ? (
              <View style={styles.diaryList}>
                {dreamHistory.map((item) => (
                  <View key={item.id} style={styles.dreamItemContainer}>
                    <TouchableOpacity style={styles.dreamItem} activeOpacity={0.6} onPress={() => handleOpenDream(item)}>
                      <View style={styles.dreamItemHeader}>
                        <Text style={styles.dreamItemDate}>{formatDate(item.created_at)}</Text>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#ffd700" />
                      </View>
                      <Text style={styles.dreamItemText} numberOfLines={2}>{item.dream_text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dreamDeleteBtn} onPress={() => handleConfirmDelete(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.diaryEmpty}><Text style={styles.diaryEmptyText}>Tu diario está vacío</Text></View>
            )}
          </ScrollView>
        )}

        {mode === 'chat' && (
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 90}
          >
            <ScrollView 
              ref={scrollViewRef} 
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 }}
            >
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <View key={index} style={[styles.bubble, isUser ? styles.userBubble : styles.lunaBubble, msg.isDream && styles.dreamBubble]}>
                    {!isUser && <Text style={styles.senderName}>Luna 🌙</Text>}
                    <Text style={[styles.msgText, isUser ? styles.userText : styles.lunaText]}>{msg.text}</Text>
                    {!isUser && !msg.isDream && (
                      <TouchableOpacity onPress={() => Share.share({ message: msg.text + "\n\n✨ Sueños" })} style={{ alignSelf: 'flex-end', marginTop: 5 }}>
                        <Ionicons name="share-social-outline" size={16} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {loading && <View style={styles.loadingBubble}><ActivityIndicator color="#FFD700" size="small" /><Text style={styles.loadingText}>Los astros susurran...</Text></View>}
            </ScrollView>

            <View style={[styles.chatInputBar]}>
              <TextInput 
                style={styles.chatInput} 
                placeholder="Pregúntale a Luna..." 
                placeholderTextColor="#888" 
                value={chatInputText} 
                onChangeText={setChatInputText} 
              />
              <TouchableOpacity style={[styles.chatSendBtn, (!chatInputText.trim() || loading) && { opacity: 0.5 }]} onPress={handleReply} disabled={!chatInputText.trim() || loading}>
                <Ionicons name="arrow-up" size={20} color="#000" />
                {!isPremium && <Text style={styles.costText}>-1</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      {/* FIXED BANNER AT BOTTOM */}
      <View style={[styles.fixedBannerContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <AdBanner />
      </View>
      
      {/* ALERTS */}
      <MagicAlert visible={deleteAlertVisible} title="¿Borrar sueño?" message="No se puede deshacer." icon="trash-bin" onConfirm={performDelete} onCancel={() => setDeleteAlertVisible(false)} confirmText="Borrar" />
      <MagicAlert 
        visible={magicAlert.visible} 
        title={magicAlert.title} 
        message={magicAlert.message} 
        icon={magicAlert.icon as any} 
        confirmText={magicAlert.title === "Poca Energía" ? "Ir a Tienda" : "Aceptar"}
        onConfirm={() => {
           if (magicAlert.title === "Poca Energía") router.push('/energy');
           setMagicAlert({ ...magicAlert, visible: false });
        }}
        onCancel={() => setMagicAlert({ ...magicAlert, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, minHeight: 50 },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  backText: { fontSize: 18, color: '#FFD700', marginLeft: 5 },
  energyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  energyText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  magicCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', opacity: 0.8, marginLeft: 10 },
  dreamInput: { color: '#fff', fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 },
  mainButton: { borderRadius: 30, overflow: 'hidden' },
  buttonGradient: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  diaryTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 10, flex: 1 },
  diaryCount: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  diaryCountText: { color: '#ffd700', fontSize: 14, fontWeight: '600' },
  diaryList: { paddingBottom: 20 },
  dreamItemContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dreamItem: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  dreamDeleteBtn: { padding: 10, marginLeft: 5, justifyContent: 'center', alignItems: 'center' },
  dreamItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dreamItemDate: { fontSize: 12, color: '#ffd700', fontWeight: '500' },
  dreamItemText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 20 },
  diaryEmpty: { alignItems: 'center', padding: 20 },
  diaryEmptyText: { color: 'rgba(255,255,255,0.3)' },
  bubble: { padding: 16, borderRadius: 16, marginBottom: 16, maxWidth: '85%' },
  userBubble: { backgroundColor: '#4A00E0', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  lunaBubble: { backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dreamBubble: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: '#ffd700', borderWidth: 1, width: '100%', maxWidth: '100%' },
  senderName: { color: '#FFD700', fontSize: 12, marginBottom: 4, fontWeight: 'bold' },
  msgText: { fontSize: 16, lineHeight: 24 },
  userText: { color: '#FFF' },
  lunaText: { color: 'rgba(255,255,255,0.9)' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, alignSelf: 'flex-start' },
  loadingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  chatInputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 15, backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: '#fff', maxHeight: 100 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  costText: { fontSize: 10, color: '#000', fontWeight: 'bold', marginTop: -2 },
  fixedBannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingTop: 5,
  },
});