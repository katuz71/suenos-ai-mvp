import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../src/hooks/useMonetization';
// Исправленный импорт аналитики для устранения WARN
import firebaseAnalytics from '@react-native-firebase/analytics';

const ENERGY_PACKS = [
  { id: 'energy_10_v2', amount: 10, price: '199 ₽', numericPrice: 199, icon: 'flash-outline' },
  { id: 'energy_50_v2', amount: 50, price: '799 ₽', numericPrice: 799, icon: 'flash', popular: true },
  { id: 'energy_150_v2', amount: 150, price: '1 990 ₽', numericPrice: 1990, icon: 'thunderstorm' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { buyPremium, loading, refreshStatus } = useMonetization(); 
  const [selectedPack, setSelectedPack] = useState(ENERGY_PACKS[1].id);

  const handlePurchase = async () => {
    const pack = ENERGY_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;

    try {
      // 1. Логируем попытку покупки (современный синтаксис)
      await firebaseAnalytics().logEvent('energy_purchase_attempt', {
        item_id: selectedPack,
        energy_amount: pack.amount
      });

      const success = await buyPremium(selectedPack);
      
      if (success) {
        // 2. Логируем успех с передачей ценности (Revenue)
        await firebaseAnalytics().logEvent('energy_purchase_success', {
          item_id: selectedPack,
          value: pack.numericPrice,
          currency: 'RUB', // Важно для отчетов о доходах
          energy_amount: pack.amount
        });
        
        console.log(`📈 Аналитика: Событие покупки ${selectedPack} на сумму ${pack.numericPrice} RUB отправлено`);
        
        await refreshStatus();
        router.replace('/(tabs)/suenos');
      }
    } catch (error) {
      console.error('Ошибка покупки:', error);
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
            <Ionicons name="sparkles" size={60} color="#ffd700" />
            <Text style={styles.title}>Заряди свою Луну</Text>
            <Text style={styles.subtitle}>Энергия нужна для толкования снов и глубоких предсказаний.</Text>
          </View>

          {ENERGY_PACKS.map((pack) => (
            <TouchableOpacity 
              key={pack.id}
              style={[styles.planCard, selectedPack === pack.id && styles.selectedPlan]}
              onPress={() => setSelectedPack(pack.id)}
            >
              <View style={styles.planInfo}>
                <Ionicons name={pack.icon as any} size={24} color={selectedPack === pack.id ? "#ffd700" : "#fff"} />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.planTitle}>{pack.amount} Энергии</Text>
                  {pack.popular && <Text style={styles.popularTag}>ПОПУЛЯРНО</Text>}
                </View>
              </View>
              <Text style={styles.planPrice}>{pack.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={handlePurchase} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={styles.ctaText}>Купить энергию</Text>}
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
  planCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  selectedPlan: { borderColor: '#ffd700', backgroundColor: 'rgba(255,215,0,0.1)' },
  planInfo: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPrice: { color: '#ffd700', fontSize: 18, fontWeight: 'bold' },
  popularTag: { color: '#ffd700', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  footer: { padding: 25 },
  cta: { backgroundColor: '#ffd700', padding: 18, borderRadius: 30, alignItems: 'center' },
  ctaText: { color: '#0f0c29', fontSize: 18, fontWeight: 'bold' }
});