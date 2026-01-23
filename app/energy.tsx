import React, { useState, useCallback, useEffect, useRef } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Alert, Platform, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { useMonetization } from '../src/hooks/useMonetization';
import MagicAlert from '../src/components/MagicAlert';
import analytics from '@react-native-firebase/analytics'; 
import * as Ads from 'react-native-google-mobile-ads';
import { THEME } from '../src/constants/theme'; 

const { width } = Dimensions.get('window');

// --- ЗВЕЗДЫ ---
const TwinklingStar = ({ index }: { index: number }) => {
  const opacity = useRef(new Animated.Value(Math.random() * 0.8 + 0.1)).current;
  
  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: Math.random() * 0.8 + 0.1, duration: Math.random() * 2000 + 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: Math.random() * 0.3 + 0.05, duration: Math.random() * 2000 + 1000, useNativeDriver: true }),
      ])
    );
    twinkle.start();
    return () => twinkle.stop();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity,
          transform: [{ scale: Math.random() * 1.5 + 0.5 }],
        }
      ]}
    />
  );
};

const adUnitId = __DEV__ ? Ads.TestIds.REWARDED : 'ca-app-pub-8147866560220122/6913262165';
const PRIVACY_URL = 'https://aiinsightshub.site/privacy.html';
const TERMS_URL = 'https://aiinsightshub.site/terms.html';

const PRICE_MAP: Record<string, { value: string, amount: number, title: string, iconScale: number }> = {
  'energy_10_v2': { value: '0.99', amount: 10, title: 'Puñado de Estrellas', iconScale: 1 },
  'energy_50_v2': { value: '3.99', amount: 50, title: 'Resplandor Místico', iconScale: 1.2 },
  'energy_150_v2': { value: '9.99', amount: 150, title: 'Fuente Eterna', iconScale: 1.4 },
};

export default function EnergyScreen() {
  const router = useRouter();
  const { credits, buyPremium, addFreeEnergy, refreshStatus, isPremium } = useMonetization();
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [magicVisible, setMagicVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const useRewarded = Ads.useRewardedAd || (() => ({ isLoaded: false, load: () => {}, show: () => {}, isEarnedReward: false, error: null }));
  const { isLoaded, load, show, isEarnedReward, error } = useRewarded(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => { if (load) load(); }, [load]);
  useEffect(() => { if (error) console.log('AdMob Load Error:', error.message); }, [error]);

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
      if (__DEV__) {
          Alert.alert("Dev Mode", "Simulando anuncio...");
          addFreeEnergy(); 
      } else {
          Alert.alert("Cargando...", "El video mágico se está preparando. Intenta en unos segundos.");
          if (load) load(); 
      }
    }
  };

  const handlePurchase = async (id: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const success = await buyPremium(id);
      if (success) {
        await refreshStatus(); 
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
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
         {[...Array(40)].map((_, i) => <TwinklingStar key={i} index={i} />)}
      </View>
      
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
        
        {/* FREE SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.glassCard}>
            <LinearGradient 
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} 
              style={StyleSheet.absoluteFill} 
            />
            <View style={styles.cardHeader}>
              <View style={styles.giftIconContainer}>
                 <Ionicons name="gift" size={24} color="#ffd700" />
              </View>
              <View style={{flex: 1}}>
                 <Text style={styles.cardTitle}>Regalo Astral</Text>
                 <Text style={styles.cardDescription}>Mira una visión corta y recibe +1 ✨</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.adButton, !isLoaded && { opacity: 0.7 }]} 
              onPress={handleWatchAd}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#8E2DE2', '#4A00E0']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.adGradient}>
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

        {/* PAID SECTION */}
        <View style={styles.paidSection}>
          <Text style={styles.sectionTitle}>Recargar Energía</Text>
          
          {Object.entries(PRICE_MAP).map(([id, info]) => {
            const isPopular = id === 'energy_50_v2';
            const CardWrapper = isPopular ? Animated.View : View;
            const animStyle = isPopular ? { transform: [{ scale: pulseAnim }] } : {};

            return (
              <CardWrapper key={id} style={[styles.purchaseCardContainer, animStyle]}>
                <TouchableOpacity 
                  style={[
                    styles.purchaseCard, 
                    isPopular && styles.popularCard
                  ]} 
                  onPress={() => handlePurchase(id)}
                  disabled={isPurchasing}
                  activeOpacity={0.9}
                >
                  <LinearGradient 
                    colors={isPopular 
                      // ЧИСТЫЙ СВЕТЛЫЙ ГРАДИЕНТ (Убрали желтизну, чтобы не было "коричневого")
                      ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)'] 
                      : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']} 
                    style={styles.cardGradient}
                  >
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>MEJOR OPCIÓN</Text>
                      </View>
                    )}
                    
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        {/* Иконка звезды */}
                        <View style={[styles.iconCircle, isPopular && styles.iconCirclePopular]}>
                          <Ionicons name="star" size={20 * info.iconScale} color={isPopular ? "#FFD700" : "rgba(255,255,255,0.8)"} />
                        </View>
                        <View style={{ marginLeft: 15 }}>
                          <Text style={[styles.purchaseTitle, isPopular && { color: '#FFD700' }]}>{info.title}</Text>
                          <Text style={styles.purchaseAmount}>{info.amount} Energías</Text>
                        </View>
                      </View>
                      
                      <View style={styles.priceContainer}>
                        {isPopular && <Text style={styles.oldPrice}>4.99</Text>}
                        <View style={isPopular ? styles.priceButtonPopular : styles.priceButton}>
                           <Text style={[styles.purchasePrice, isPopular ? { color: '#000' } : { color: '#fff' }]}>
                             {info.value}
                           </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </CardWrapper>
            );
          })}
        </View>

        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Ionicons name="refresh" size={14} color="#ffd700" style={{ marginRight: 6 }} />
            <Text style={styles.restoreBtnText}>Restaurar Compras</Text>
          </TouchableOpacity>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.linkText}>Términos</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.linkText}>Privacidad</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{height: 60}} />
      </ScrollView>

      {isPurchasing && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
             <ActivityIndicator size="large" color="#ffd700" />
             <Text style={styles.loaderText}>Procesando...</Text>
          </View>
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
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  closeButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: THEME.fonts.serif, letterSpacing: 1 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ffd700' },
  balanceText: { color: '#ffd700', fontSize: 16, fontWeight: '700', marginLeft: 6 },
  scrollContent: { paddingHorizontal: 20 },
  sectionContainer: { marginBottom: 30 },
  glassCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  giftIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', fontFamily: THEME.fonts.serif, marginBottom: 4 },
  cardDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  adButton: { borderRadius: 16, overflow: 'hidden', width: '100%', height: 54, marginTop: 5 },
  adGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', fontFamily: THEME.fonts.serif, letterSpacing: 1 },
  paidSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16, opacity: 0.9, fontFamily: THEME.fonts.serif, letterSpacing: 0.5, marginLeft: 5 },
  
  purchaseCardContainer: { marginBottom: 16 },
  purchaseCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  
  // --- ЧИСТАЯ ЗОЛОТАЯ ОБВОДКА БЕЗ ТЕНИ ВНУТРИ ---
  popularCard: { 
    borderColor: '#FFD700', // Чистое золото
    borderWidth: 1,         // Тонкая линия
    // Убрали тень, чтобы не было "грязи"
  },
  
  cardGradient: { padding: 18 },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ffd700', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 16, zIndex: 1 },
  popularBadgeText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconCirclePopular: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: '#FFD700' },
  
  purchaseTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(255,255,255,0.9)', fontFamily: THEME.fonts.serif, marginBottom: 2 },
  purchaseAmount: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '500' },
  
  priceContainer: { alignItems: 'flex-end' },
  oldPrice: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'line-through', marginBottom: 4, marginRight: 4 },
  
  priceButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  priceButtonPopular: { backgroundColor: '#ffd700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, shadowColor: '#ffd700', shadowOpacity: 0.3, shadowRadius: 5 },
  
  purchasePrice: { fontSize: 16, fontWeight: '700', fontFamily: THEME.fonts.serif },
  
  legalFooter: { marginTop: 10, alignItems: 'center', paddingTop: 20 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 5 },
  restoreBtnText: { color: '#ffd700', fontSize: 13, fontWeight: '600' },
  linksRow: { flexDirection: 'row', alignItems: 'center', opacity: 0.6 },
  linkText: { color: '#fff', fontSize: 12 },
  linkDivider: { color: '#fff', marginHorizontal: 10 },
  
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loaderBox: { backgroundColor: '#1a1a2e', padding: 25, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  loaderText: { color: '#ffd700', marginTop: 15, fontSize: 16, fontFamily: THEME.fonts.serif }
});