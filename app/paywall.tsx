import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../src/hooks/useMonetization';

export default function PaywallScreen() {
  const router = useRouter();
  const { buyPremium, loading, refreshStatus } = useMonetization();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'lifetime'>('weekly');

  const handlePurchase = async () => {
    const success = await buyPremium();
    if (success) {
      await refreshStatus();
      
      // Небольшая задержка для обновления UI
      setTimeout(() => {
        router.replace('/(tabs)/suenos');
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.safeArea}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Ionicons name="moon" size={60} color="#ffd700" />
            <Text style={styles.title}>Стань Мастером Снов</Text>
            <Text style={styles.subtitle}>Получи неограниченный доступ к мудрости звезд и глубинам подсознания.</Text>
          </View>

          <View style={styles.features}>
            <Text style={styles.feature}><Ionicons name="star" color="#ffd700" /> Безлимитные толкования</Text>
            <Text style={styles.feature}><Ionicons name="star" color="#ffd700" /> Расширенный гороскоп</Text>
            <Text style={styles.feature}><Ionicons name="star" color="#ffd700" /> Никакой рекламы</Text>
          </View>

          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'weekly' && styles.selectedPlan]}
            onPress={() => setSelectedPlan('weekly')}
          >
            <Text style={styles.planTitle}>Неделя доступа</Text>
            <Text style={styles.planPrice}>199 ₽</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'lifetime' && styles.selectedPlan]}
            onPress={() => setSelectedPlan('lifetime')}
          >
            <Text style={styles.planTitle}>Навсегда</Text>
            <Text style={styles.planPrice}>3 990 ₽</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={handlePurchase} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={styles.ctaText}>Активировать доступ</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: 50 },
  closeButton: { alignSelf: 'flex-end', padding: 20 },
  scroll: { paddingHorizontal: 25 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 15 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginTop: 10 },
  features: { marginBottom: 30 },
  feature: { color: '#eee', fontSize: 17, marginBottom: 12 },
  planCard: { padding: 20, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 15, borderWidth: 1, borderColor: 'transparent' },
  selectedPlan: { borderColor: '#ffd700', backgroundColor: 'rgba(255,215,0,0.1)' },
  planTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPrice: { color: '#ffd700', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  footer: { padding: 25 },
  cta: { backgroundColor: '#ffd700', padding: 18, borderRadius: 30, alignItems: 'center' },
  ctaText: { color: '#0f0c29', fontSize: 18, fontWeight: 'bold' }
});