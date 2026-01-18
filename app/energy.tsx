import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../src/hooks/useMonetization';
import { supabase } from '../src/services/supabase';
import WatchAdButton from '../src/components/WatchAdButton';
import MagicAlert from '../src/components/MagicAlert';

const PRIVACY_POLICY_URL = 'https://docs.google.com/document/d/1I-yKqNSVKNgyb7m4wtqVBtA-9MNHwOxax7NMOoKVX84';
const TERMS_URL = 'https://docs.google.com/document/d/1OJo14MGTZXWDDucssR7kNZ74UKDI2AxO1zS8pu2YWU4';

export default function EnergyScreen() {
  const router = useRouter();
  const { credits, refreshStatus } = useMonetization();
  
  const [magicAlertVisible, setMagicAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', icon: '' });

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) { console.error("Error opening link", err); }
  };

  const handleRestore = () => {
    setAlertConfig({ title: "Restaurado", message: "Tus compras han sido restauradas.", icon: "refresh" });
    setMagicAlertVisible(true);
  };

  const handlePurchase = async (item: 'starter' | 'dreamer' | 'magician') => {
    // В релизной сборке __DEV__ будет false, так что халявы не будет.
    // Но для твоих тестов на эмуляторе покупки продолжат работать.
    if (__DEV__) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let newCredits = credits;
        if (item === 'starter') newCredits += 10;
        if (item === 'dreamer') newCredits += 50;
        if (item === 'magician') newCredits += 150;

        await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
        
        await refreshStatus();
        
        setAlertConfig({ title: "¡Éxito! (Test)", message: `Energía recibida. Nuevo balance: ${newCredits}`, icon: "checkmark-circle" });
        setMagicAlertVisible(true);
      } catch (e) { console.error(e); }
      return;
    }
    
    // Заглушка для реального продакшена (пока не подключен RevenueCat/IAP)
    setAlertConfig({ title: "Tienda Cerrada", message: "Las estrellas se están alineando. Inténtalo más tarde.", icon: "construct" });
    setMagicAlertVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      
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
        
        {/* REWARDED AD SECTION */}
        <View style={styles.freeSection}>
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="gift-outline" size={32} color="#ffd700" />
              <Text style={styles.cardTitle}>Regalo Astral</Text>
            </View>
            <Text style={styles.cardDescription}>Mira una visión corta y recibe +1 energía del universo.</Text>
            
            <WatchAdButton onReward={refreshStatus} />
            
          </View>
        </View>

        <View style={styles.paidSection}>
          <Text style={styles.sectionTitle}>Recargar Energía</Text>
          
          <TouchableOpacity style={styles.purchaseCard} onPress={() => handlePurchase('starter')}>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}><Ionicons name="star" size={20} color="#ffd700" /></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.purchaseTitle}>Puñado de Estrellas</Text>
                    <Text style={styles.purchaseAmount}>10 Energías</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}><Text style={styles.purchasePrice}>€0.99</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.purchaseCard, styles.popularCard]} onPress={() => handlePurchase('dreamer')}>
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
                  <Text style={styles.oldPrice}>€4.99</Text>
                  <Text style={styles.purchasePrice}>€3.99</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.purchaseCard} onPress={() => handlePurchase('magician')}>
            <LinearGradient colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.1)']} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(147, 51, 234, 0.3)' }]}><Ionicons name="infinite" size={20} color="#d8b4fe" /></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.purchaseTitle}>Fuente Eterna</Text>
                    <Text style={styles.purchaseAmount}>150 Energías</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}><Text style={styles.purchasePrice}>€9.99</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}><Text style={styles.restoreBtnText}>Restaurar Compras</Text></TouchableOpacity>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => openLink(TERMS_URL)}><Text style={styles.linkText}>Términos de Uso</Text></TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)}><Text style={styles.linkText}>Privacidad</Text></TouchableOpacity>
          </View>
        </View>

        <Text style={styles.restoreText}>La energía no caduca. Recibes +1 energía diaria gratis al entrar.</Text>
        <View style={{height: 40}} />
      </ScrollView>

      <MagicAlert 
        visible={magicAlertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText="Entendido"
        onConfirm={() => setMagicAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  balanceText: { color: '#ffd700', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  freeSection: { marginBottom: 32 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#ffd700', marginLeft: 12 },
  cardDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16 },
  paidSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16, opacity: 0.8 },
  purchaseCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  popularCard: { borderWidth: 1, borderColor: '#ffd700', transform: [{ scale: 1.02 }] },
  cardGradient: { padding: 16 },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ffd700', paddingHorizontal: 8, paddingVertical: 2, borderBottomLeftRadius: 8 },
  popularBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  purchaseTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  purchaseAmount: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  purchasePrice: { fontSize: 18, fontWeight: '700', color: '#fff' },
  oldPrice: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'line-through' },
  restoreText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  legalFooter: { marginTop: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  restoreBtn: { marginBottom: 15 },
  restoreBtnText: { color: '#ffd700', fontSize: 14, fontWeight: '500' },
  linksRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  linkDivider: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },
});