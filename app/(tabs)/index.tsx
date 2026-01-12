import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../src/constants/Colors';
import { supabase, checkUsageLimit, incrementUsageCount } from '../../src/services/supabase';
import { interpretDream } from '../../src/services/openai';
import { Message, UserProfile } from '../../src/types/chat';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUserProfile();
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: t('chat.welcomeMessage'),
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const typewriterEffect = async (text: string, messageId: string) => {
    setIsTyping(true);
    let currentText = '';
    
    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      setTypingText(currentText);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, text: currentText, isTyping: true }
            : msg
        )
      );
      
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isTyping: false }
          : msg
      )
    );
    
    setIsTyping(false);
    setTypingText('');
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !userProfile) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const usageCheck = await checkUsageLimit(session.user.id);

    if (!usageCheck.canUse) {
      router.push('/modal/paywall');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await interpretDream(inputText.trim(), {
        display_name: userProfile.display_name,
        zodiac_sign: userProfile.zodiac_sign,
      });

      await incrementUsageCount(session.user.id);

      const lunaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, lunaMessage]);
      setIsLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      await typewriterEffect(response, lunaMessage.id);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      setIsLoading(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('chat.errorMessage'),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.lunaMessageContainer}>
        <View style={styles.lunaIconContainer}>
          <Text style={styles.lunaIcon}>🌙</Text>
        </View>
        <View style={styles.lunaBubble}>
          <Text style={styles.lunaMessageText}>
            {item.text}
            {item.isTyping && <Text style={styles.cursor}>▌</Text>}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.primary, Colors.background.secondary]}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('chat.header')}</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile ? `${userProfile.display_name} • ${userProfile.zodiac_sign}` : ''}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.loadingIcon}>✨</Text>
            </Animated.View>
            <Text style={styles.loadingText}>{t('chat.loadingText')}</Text>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.inputPlaceholder')}
              placeholderTextColor={Colors.text.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading && !isTyping}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading || isTyping) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading || isTyping}
            >
              <Text style={styles.sendButtonText}>✨</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent.gold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.muted,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 20,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: Colors.accent.darkGold,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '75%',
  },
  userMessageText: {
    fontSize: 16,
    color: Colors.background.primary,
    lineHeight: 22,
  },
  lunaMessageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  lunaIconContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  lunaIcon: {
    fontSize: 24,
  },
  lunaBubble: {
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    borderWidth: 1,
    borderColor: Colors.mystic.violet,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '75%',
  },
  lunaMessageText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  cursor: {
    color: Colors.accent.gold,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loadingIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.mystic.lavender,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.ui.inputBg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.ui.border,
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
  },
});
