import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { useMonetization } from '../src/hooks/useMonetization';
import WatchAdButton from '../src/components/WatchAdButton';
import MagicAlert from '../src/components/MagicAlert';
import firebaseAnalytics from '@react-native-firebase/analytics';

const PRIVACY_POLICY_URL = 'https://docs.google.com/document/d/1I-yKqNSVKNgyb7m4wtqVBtA-9MNHwOxax7NMOoKVX84';
const TERMS_URL = 'https://docs.google.com/document/d/1OJo14MGTZXWDDucssR7kNZ74UKDI2AxO1zS8pu2YWU4';

const PRICE_MAP: Record<string, { value: number, amount: number }> = {
  'energy_10_v2': { value: 0.99, amount: 10 },
  'energy_50_v2': { value: 3.99, amount: 50 },
  'energy_150_v2': { value: 9.99, amount: 150 },
};

export default function EnergyScreen() {
  const router = useRouter();
  const { credits, buyPremium, addFreeEnergy } = useMonetization();
  
  const [magicAlertVisible, setMagicAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });
  const [isPurchasing, setIsPurchasing] = useState(false);

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) { console.error("Error opening link", err); }
  };

  const handleRestore = async () => {
      try {
        await Purchases.restorePurchases();
        setAlertConfig({ 
          title: "Restaurado", 
          message: "Tu historial de compras ha sido verificado con éxito.", 
          icon: "refresh" 
        });
        setMagicAlertVisible(true);
      } catch (e) {
        Alert.alert("Error", "No se pudieron restaurar las compras.");
      }
    };

  const handlePurchase = async (packageId: 'energy_10_v2' | 'energy_50_v2' | 'energy_150_v2') => {
    if (isPurchasing) return;
    setIsPurchasing(true);

    try {
      await firebaseAnalytics().logEvent('energy_purchase_attempt', {
        item_id: packageId,
        energy_amount: PRICE_MAP[packageId].amount
      });

      const success = await buyPremium(packageId);

      if (success) {
        await firebaseAnalytics().logEvent('energy_purchase_success', {
          item_id: packageId,
          value: PRICE_MAP[packageId].value,
          currency: 'EUR',
          energy_amount: PRICE_MAP[packageId].amount
        });
        
        setAlertConfig({ 
          title: "¡Éxito!", 
          message: `Has recibido ${PRICE_MAP[packageId].amount} energías estelares.`, 
          icon: "checkmark-circle" 
        });
        setMagicAlertVisible(true);
      }
    } catch (e: any) {
      console.error("Purchase error:", e);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tienda Mística</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="sparkles" size={16} color="#ffd700" />
          <Text style={styles.balanceText}>{credits}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* FREE SECTION */}
        <View style={styles.freeSection}>
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="gift-outline" size={32} color="#ffd700" />
              <Text style={styles.cardTitle}>Regalo Astral</Text>
            </View>
            <Text style={styles.cardDescription}>Mira una visión corta y recibe +1 de energía gratuita.</Text>
            <WatchAdButton onReward={addFreeEnergy} />
          </View>
        </View>

        {/* PAID SECTION */}
        <View style={styles.paidSection}>
          <Text style={styles.sectionTitle}>Recargar Energía</Text>
          
          {/* PACK 10 */}
          <TouchableOpacity style={styles.purchaseCard} onPress={() => handlePurchase('energy_10_v2')} disabled={isPurchasing}>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}><Ionicons name="star" size={20} color="#ffd700" /></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.purchaseTitle}>Puñado de Estrellas</Text>
                    <Text style={styles.purchaseAmount}>10 Energías</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}><Text style={styles.purchasePrice}>0.99 €</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* PACK 50 - POPULAR */}
          <TouchableOpacity style={[styles.purchaseCard, styles.popularCard]} onPress={() => handlePurchase('energy_50_v2')} disabled={isPurchasing}>
            <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} style={styles.cardGradient}>
              <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Popular</Text></View>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}><Ionicons name="flash" size={20} color="#ffd700" /></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.purchaseTitle}>Resplandor Místico</Text>
                    <Text style={styles.purchaseAmount}>50 Energías</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.oldPrice}>4.99 €</Text>
                  <Text style={styles.purchasePrice}>3.99 €</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* PACK 150 */}
          <TouchableOpacity style={styles.purchaseCard} onPress={() => handlePurchase('energy_150_v2')} disabled={isPurchasing}>
            <LinearGradient colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.1)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(147, 51, 234, 0.3)' }]}><Ionicons name="thunderstorm" size={20} color="#d8b4fe" /></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.purchaseTitle}>Fuente Eterna</Text>
                    <Text style={styles.purchaseAmount}>150 Energías</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}><Text style={styles.purchasePrice}>9.99 €</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* LEGAL FOOTER */}
        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>Restaurar Compras</Text>
          </TouchableOpacity>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => openLink(TERMS_URL)}>
              <Text style={styles.linkText}>Términos</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)}>
              <Text style={styles.linkText}>Privacidad</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{height: 40}} />
      </ScrollView>

      {isPurchasing && (
        <View style={styles.loaderOverlay}><ActivityIndicator size="large" color="#ffd700" /></View>
      )}

      <MagicAlert 
        visible={magicAlertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText="Aceptar"
        onConfirm={() => setMagicAlertVisible(false)}
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
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#ffd700', marginLeft: 12 },
  cardDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16 },
  paidSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16, opacity: 0.8 },
  purchaseCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  popularCard: { borderWidth: 1.5, borderColor: '#ffd700', transform: [{ scale: 1.02 }] },
  cardGradient: { padding: 16 },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ffd700', paddingHorizontal: 10, paddingVertical: 2, borderBottomLeftRadius: 10 },
  popularBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  purchaseTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  purchaseAmount: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  purchasePrice: { fontSize: 18, fontWeight: '700', color: '#fff' },
  oldPrice: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'line-through' },
  legalFooter: { marginTop: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20, paddingBottom: 10 },
  restoreBtn: { marginBottom: 10 },
  restoreBtnText: { color: '#ffd700', fontSize: 14 },
  linksRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  linkDivider: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});