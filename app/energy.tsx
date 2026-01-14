import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../src/hooks/useMonetization';
import WatchAdButton from '../src/components/WatchAdButton';

export default function EnergyScreen() {
  const router = useRouter();
  const { credits } = useMonetization();

  const handlePurchase = (item: string) => {
    Alert.alert('Скоро', 'Покупки будут доступны в релизе');
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0f0c29', '#302b63', '#24243e']} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* ХЕДЕР */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Магазин Энергии</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="sparkles" size={16} color="#ffd700" />
          <Text style={styles.balanceText}>{credits}</Text>
        </View>
      </View>

      {/* КОНТЕНТ */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* СЕКЦИЯ "БЕСПЛАТНО" */}
        <View style={styles.freeSection}>
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="gift-outline" size={32} color="#ffd700" />
              <Text style={styles.cardTitle}>Дар Звезд</Text>
            </View>
            <Text style={styles.cardDescription}>
              Посмотри короткое видение и получи энергию от вселенной
            </Text>
            <WatchAdButton />
          </View>
        </View>

        {/* СЕКЦИЯ "КУПИТЬ ЭНЕРГИЮ" */}
        <View style={styles.paidSection}>
          <Text style={styles.sectionTitle}>Купи энергию</Text>
          
          {/* Карточка 1 */}
          <TouchableOpacity 
            style={styles.purchaseCard}
            onPress={() => handlePurchase('small')}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Ionicons name="star-outline" size={24} color="#ffd700" />
                  <View>
                    <Text style={styles.purchaseTitle}>Горсть звезд</Text>
                    <Text style={styles.purchaseAmount}>+5 энергий</Text>
                  </View>
                </View>
                <Text style={styles.purchasePrice}>$0.99</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Карточка 2 */}
          <TouchableOpacity 
            style={[styles.purchaseCard, styles.popularCard]}
            onPress={() => handlePurchase('medium')}
          >
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Выгодно</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Ionicons name="bag-outline" size={24} color="#ffd700" />
                  <View>
                    <Text style={styles.purchaseTitle}>Мешок света</Text>
                    <Text style={styles.purchaseAmount}>+20 энергий</Text>
                  </View>
                </View>
                <Text style={styles.purchasePrice}>$2.99</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Карточка 3 */}
          <TouchableOpacity 
            style={styles.purchaseCard}
            onPress={() => handlePurchase('premium')}
          >
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.1)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Ionicons name="infinite-outline" size={24} color="#9333EA" />
                  <View>
                    <Text style={styles.purchaseTitle}>Бесконечность</Text>
                    <Text style={styles.purchaseAmount}>Premium навсегда</Text>
                  </View>
                </View>
                <Text style={styles.purchasePrice}>$9.99</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Текст о восстановлении */}
        <Text style={styles.restoreText}>
          Энергия восстанавливается сама каждые 24 часа
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0f0c29' 
  },
  
  // ХЕДЕР
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  balanceText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // СЕКЦИЯ БЕСПЛАТНО
  freeSection: {
    marginBottom: 32,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffd700',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },

  // СЕКЦИЯ ПЛАТНО
  paidSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    opacity: 0.8,
  },
  purchaseCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  cardGradient: {
    padding: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  popularBadgeText: {
    color: '#ffd700',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  purchaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  purchaseAmount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  purchasePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffd700',
  },

  // Текст о восстановлении
  restoreText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});