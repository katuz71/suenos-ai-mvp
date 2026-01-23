import React, { useState, useCallback, useEffect } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { useMonetization } from '../src/hooks/useMonetization';
import MagicAlert from '../src/components/MagicAlert';
import analytics from '@react-native-firebase/analytics'; 
import * as Ads from 'react-native-google-mobile-ads';

// Конфигурация
const adUnitId = __DEV__ ? Ads.TestIds.REWARDED : 'ca-app-pub-8147866560220122/6913262165';
const PRIVACY_URL = 'https://aiinsightshub.site/privacy.html';
const TERMS_URL = 'https://aiinsightshub.site/terms.html';

// LUNA: Убрала жесткий символ €, чтобы не пугать пользователей из США.
// В идеале позже нужно получать 'priceString' напрямую из RevenueCat.
const PRICE_MAP: Record<string, { value: string, amount: number, title: string }> = {
  'energy_10_v2': { value: '0.99', amount: 10, title: 'Puñado de Estrellas' },
  'energy_50_v2': { value: '3.99', amount: 50, title: 'Resplandor Místico' },
  'energy_150_v2': { value: '9.99', amount: 150, title: 'Fuente Eterna' },
};

export default function EnergyScreen() {
  const router = useRouter();
  const { credits, buyPremium, addFreeEnergy, refreshStatus, isPremium } = useMonetization();
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [magicVisible, setMagicVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

  // Безопасная инициализация рекламы
  const useRewarded = Ads.useRewardedAd || (() => ({ isLoaded: false, load: () => {}, show: () => {}, isEarnedReward: false, error: null }));
  const { isLoaded, load, show, isEarnedReward, error } = useRewarded(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    if (load) load();
  }, [load]);

  useEffect(() => {
    if (error) console.log('AdMob Load Error:', error.message);
  }, [error]);

  // Начисление за видео
  useEffect(() => {
    if (isEarnedReward) {
      addFreeEnergy();
      setAlertConfig({ title: "¡Gracias!", message: "Has recibido +1 ✨ por ver el video.", icon: "sparkles" });
      setMagicVisible(true);
    }
  }, [isEarnedReward]);

  useFocusEffect(
    useCallback(() => {
      analytics().logScreenView({ screen_name: 'Tienda', screen_class: 'EnergyScreen' });
      analytics().logEvent('shop_opened');
    }, [])
  );

  const handleWatchAd = async () => {
    if (isLoaded) {
      await analytics().logEvent('ad_reward_click');
      show();
    } else {
      // LUNA FIX: Если реклама не готова, НЕ даем награду. 
      // Иначе пользователи будут абузить это при плохом интернете.
      if (__DEV__) {
          Alert.alert("Dev Mode", "Simulando anuncio (DEV only)...");
          addFreeEnergy(); // Только для тестов!
      } else {
          Alert.alert("Cargando...", "El video mágico se está preparando. Intenta en unos segundos.");
          if (load) load(); // Пробуем перезагрузить
      }
    }
  };

  const handlePurchase = async (id: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const success = await buyPremium(id);
      if (success) {
        await refreshStatus(); // Синхронизируем баланс
        setAlertConfig({ 
          title: "¡Éxito!", 
          message: `Has recibido las energías estelares correctamente.`, 
          icon: "checkmark-circle" 
        });
        setMagicVisible(true);
      }
    } catch (e) {
      console.log("Purchase error:", e);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await Purchases.restorePurchases();
      await refreshStatus();
      setAlertConfig({ title: "Restaurado", message: "Tu historial de compras ha sido verificado.", icon: "refresh" });
      setMagicVisible(true);
    } catch (e) {
      Alert.alert("Error", "No se pudieron restaurar las compras.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tienda Mística</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="sparkles" size={16} color="#ffd700" />
          <Text style={styles.balanceText}>{isPremium ? '∞' : credits}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.freeSection}>
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="gift-outline" size={32} color="#ffd700" />
              <Text style={styles.cardTitle}>Regalo Astral</Text>
            </View>
            <Text style={styles.cardDescription}>Mira una visión corta y recibe +1 ✨ gratuita.</Text>
            
            <TouchableOpacity 
              style={[styles.adButton, !isLoaded && { opacity: 0.7 }]} 
              onPress={handleWatchAd}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.adGradient}>
                {isLoaded ? (
                   <Ionicons name="play-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                ) : (
                   <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.adButtonText}>
                  {isLoaded ? 'VER VIDEO (+1 ✨)' : 'Cargando magia...'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paidSection}>
          <Text style={styles.sectionTitle}>Recargar Energía</Text>
          
          {Object.entries(PRICE_MAP).map(([id, info]) => (
            <TouchableOpacity 
              key={id} 
              style={[styles.purchaseCard, id === 'energy_50_v2' && styles.popularCard]} 
              onPress={() => handlePurchase(id)}
              disabled={isPurchasing}
            >
              <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.cardGradient}>
                {id === 'energy_50_v2' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="star" size={20} color="#ffd700" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.purchaseTitle}>{info.title}</Text>
                      <Text style={styles.purchaseAmount}>{info.amount} Energías</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    {/* LUNA: Убрали жесткий символ валюты. Оставили только цифры пока не подключим offerings */}
                    {id === 'energy_50_v2' && <Text style={styles.oldPrice}>4.99</Text>}
                    <Text style={styles.purchasePrice}>{info.value}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>Restaurar Compras</Text>
          </TouchableOpacity>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.linkText}>Términos</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.linkText}>Privacidad</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {isPurchasing && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ffd700" />
        </View>
      )}

      <MagicAlert 
        visible={magicVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText="Aceptar"
        onConfirm={() => setMagicVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  balanceText: { color: '#ffd700', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  scrollContent: { paddingHorizontal: 20 },
  freeSection: { marginBottom: 30 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#ffd700', marginLeft: 12 },
  cardDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16, textAlign: 'center' },
  adButton: { borderRadius: 12, overflow: 'hidden', width: '100%', height: 50 },
  adGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  paidSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16, opacity: 0.8 },
  purchaseCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  popularCard: { borderWidth: 1.5, borderColor: '#ffd700', transform: [{ scale: 1.02 }] },
  cardGradient: { padding: 16 },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ffd700', paddingHorizontal: 10, paddingVertical: 2, borderBottomLeftRadius: 10, zIndex: 1 },
  popularBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  purchaseTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  purchaseAmount: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  purchasePrice: { fontSize: 18, fontWeight: '700', color: '#fff' },
  oldPrice: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'line-through' },
  legalFooter: { marginTop: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  restoreBtn: { marginBottom: 10 },
  restoreBtnText: { color: '#ffd700', fontSize: 14 },
  linksRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  linkDivider: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});