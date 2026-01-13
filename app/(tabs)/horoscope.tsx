import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';

const PREDICTIONS = [
  "Сегодня энергии планет благоприятствуют смелым решениям. Слушай интуицию.",
  "Возможны неожиданные встречи. Обращай внимание на сны, которые видел накануне.",
  "День подходит для внутреннего созерцания. Ответ, который ты ищешь, находится внутри.",
  "Звезды советуют отложить важные финансовые вопросы на завтра.",
  "Твоя аура сегодня сияет особенно ярко. Используй это для творчества."
];

export default function HoroscopeScreen() {
  const [sign, setSign] = useState<string | null>(null);
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('zodiac_sign')
          .eq('id', user.id)
          .single();
        
        if (data?.zodiac_sign) {
          setSign(data.zodiac_sign);
          // Pick a pseudo-random prediction
          const randomIdx = Math.floor(Math.random() * PREDICTIONS.length);
          setPrediction(PREDICTIONS[randomIdx]);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Звездная Карта</Text>
          <Text style={styles.subtitle}>Прогноз на сегодня</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={40} color="#A855F7" />
          </View>
          <Text style={styles.signTitle}>{sign || "Неизвестный знак"}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.predictionText}>
            {prediction || "Звезды сегодня молчаливы..."}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => fetchData()}>
          <Text style={styles.buttonText}>Обновить энергию</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 5 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  signTitle: { fontSize: 22, fontWeight: 'bold', color: '#A855F7', textTransform: 'capitalize' },
  date: { fontSize: 14, color: '#94A3B8', marginBottom: 15 },
  divider: { height: 1, width: '100%', backgroundColor: '#334155', marginBottom: 15 },
  predictionText: { fontSize: 16, color: '#E2E8F0', lineHeight: 26, textAlign: 'center', fontStyle: 'italic' },
  button: {
    marginTop: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A855F7',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: { color: '#A855F7', fontSize: 16, fontWeight: '600' }
});
