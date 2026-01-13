import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../src/hooks/useMonetization';

export default function EnergyScreen() {
  const router = useRouter();
  const { showAd, adLoaded } = useMonetization();

  const handleWatchAd = () => {
    showAd();
    // Возвращаемся назад, чтобы пользователь сразу мог продолжить чат
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0f0c29', '#302b63', '#24243e']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.content}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={32} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <View style={styles.innerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="sparkles" size={80} color="#ffd700" />
          </View>
          
          <Text style={styles.title}>Энергия иссякла</Text>
          <Text style={styles.subtitle}>
            Твоя связь с миром снов ослабла. Восполни энергию, чтобы продолжить путь, или получи безлимитный доступ.
          </Text>

          {/* Кнопка Рекламы */}
          <TouchableOpacity 
            style={[styles.actionButton, !adLoaded && styles.disabledButton]} 
            onPress={handleWatchAd}
            disabled={!adLoaded}
          >
            <LinearGradient 
              colors={['#7C3AED', '#2563EB']} 
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.btnContent}>
                 <Ionicons name="sparkles" size={24} color="#fff" />
                 <Text style={styles.buttonText}>
                   {adLoaded ? 'Наполнить кристалл энергией (+1 ✨)' : 'Загрузка магии...'}
                 </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Кнопка Оплаты */}
          <TouchableOpacity 
            style={styles.premiumButton} 
            onPress={() => router.push('/paywall')}
          >
            <LinearGradient 
              colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} 
              style={styles.premiumGradient}
            >
              <Text style={styles.premiumText}>Стать Мастером Снов (Безлимит ∞)</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Текст о восстановлении энергии */}
          <Text style={styles.restoreText}>
            Энергия восстанавливается сама каждые 24 часа
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  content: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  closeButton: { alignSelf: 'flex-end', padding: 20 },
  innerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconWrapper: { marginBottom: 25, shadowColor: "#ffd700", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  
  // Кнопка рекламы с градиентом
  actionButton: { 
    width: '100%', 
    height: 64, 
    borderRadius: 32, 
    marginBottom: 20,
    overflow: 'hidden'
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  disabledButton: { opacity: 0.5 },
  
  // Премиум кнопка с золотой обводкой
  premiumButton: { 
    width: '100%', 
    height: 64, 
    borderRadius: 32, 
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden'
  },
  premiumGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  premiumText: { 
    color: '#ffd700', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
  // Текст о восстановлении
  restoreText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10
  }
});