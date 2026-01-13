import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';
import { interpretDream } from '../../src/services/ai';
import { useRouter } from 'expo-router';

interface UserProfile {
  display_name: string;
  zodiac_sign: string;
}

export default function SuenosScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

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

        const name = data?.display_name || 'Странник';
        const sign = data?.zodiac_sign || 'Таинственный знак';
        
        setUserProfile({ display_name: name, zodiac_sign: sign });
        
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
    Alert.alert(
      "Сброс",
      "Хочешь начать заново? Это сбросит текущую сессию.",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Выйти", 
          style: "destructive", 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input;
    const userMsg = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await interpretDream(
        userText,
        userProfile?.display_name || 'Странник',
        userProfile?.zodiac_sign || 'Неизвестно'
      );

      const lunaMsg = { 
        id: (Date.now()+1).toString(), 
        text: aiResponse, 
        sender: 'luna' 
      };
      setMessages(prev => [...prev, lunaMsg]);

    } catch (error) {
      console.error('AI Error:', error);
      const errorMsg = { 
        id: (Date.now()+1).toString(), 
        text: "Связь с астралом прервана... Попробуй позже.", 
        sender: 'luna' 
      };
      setMessages(prev => [...prev, errorMsg]);
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
          <View style={{width: 40}} />
          <View style={{alignItems: 'center'}}>
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
});