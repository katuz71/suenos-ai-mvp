import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ANSWERS = [
  "Безусловно да",
  "Звезды говорят — нет",
  "Ответ скрыт в тумане",
  "Действуй решительно",
  "Спроси позже",
  "Твоя интуиция знает ответ",
  "Остерегайся иллюзий",
  "Удача на твоей стороне"
];

export default function OracleScreen() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askOracle = () => {
    setLoading(true);
    setAnswer(null);
    
    // Simulate mystical thinking
    setTimeout(() => {
      const random = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      setAnswer(random);
      setLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Оракул</Text>
        <Text style={styles.subtitle}>Сосредоточься на вопросе...</Text>

        <View style={styles.ballContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#A855F7" />
          ) : (
            <Ionicons name="eye" size={120} color={answer ? "#A855F7" : "#334155"} />
          )}
        </View>

        {answer && (
          <View style={styles.answerBox}>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={askOracle} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Связь с космосом..." : "Получить ответ"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 50 },
  ballContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  answerBox: {
    marginBottom: 40,
    padding: 15,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 15,
  },
  answerText: { fontSize: 24, color: '#E2E8F0', fontWeight: 'bold', textAlign: 'center' },
  button: {
    backgroundColor: '#A855F7',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
