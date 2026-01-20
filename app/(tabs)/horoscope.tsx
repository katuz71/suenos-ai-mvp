import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, LayoutAnimation, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useMonetization } from '../../src/hooks/useMonetization';
import { generateDailyHoroscope } from '../../src/services/openai';
import MagicAlert from '../../src/components/MagicAlert';
// 👇 Убедитесь, что этот путь правильный
import AdBanner from '../../src/components/AdBanner'; 

const { width } = Dimensions.get('window');

// --- 1. ФУНКЦИЯ ОЧИСТКИ ТЕКСТА ОТ ЗВЕЗДОЧЕК ---
const cleanText = (text: string) => {
  if (!text) return "";
  // Удаляем ** (жирный), * (курсив), # (заголовки)
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').trim();
};

// --- 2. ГЕНЕРАТОР ЦИФР (Один раз в день) ---
const getDailyStats = (sign: string) => {
  if (!sign) return { love: 0, health: 0, money: 0, luckyNumber: 0, color: '...' };

  const todayStr = new Date().toISOString().split('T')[0]; // Получаем "2023-10-25"
  const seedString = `${sign}-${todayStr}`; // Уникальный ключ: "Aries-2023-10-25"

  // Простой генератор псевдо-случайных чисел на основе строки
  const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const result = Math.abs(hash) / 2147483647; // 0...1
    return result;
  };

  return {
    love: Math.floor(pseudoRandom(seedString + 'love') * 40) + 60,     // 60-100%
    health: Math.floor(pseudoRandom(seedString + 'health') * 40) + 60, // 60-100%
    money: Math.floor(pseudoRandom(seedString + 'money') * 40) + 60,   // 60-100%
    luckyNumber: Math.floor(pseudoRandom(seedString + 'num') * 99) + 1,
    color: ['Dorado', 'Púrpura', 'Azul Real', 'Esmeralda', 'Rubí', 'Plata', 'Blanco', 'Índigo'][Math.floor(pseudoRandom(seedString + 'col') * 8)]
  };
};

export default function HoroscopeScreen() {
  const router = useRouter();
  const { isPremium, credits, refreshStatus } = useMonetization();
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [name, setName] = useState('Viajero');
  const [zodiacSign, setZodiacSign] = useState('');
  const [prediction, setPrediction] = useState('');
  
  const [stats, setStats] = useState({ love: 0, health: 0, money: 0, luckyNumber: 0, color: '...' });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', icon: '' });

  // ЗАГРУЗКА ДАННЫХ
  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, zodiac_sign')
        .eq('id', user.id)
        .single();

      if (profile) {
        setName(profile.display_name || 'Viajero');
        const sign = profile.zodiac_sign || '';
        setZodiacSign(sign);
        
        if (sign) {
          // Генерируем стабильные цифры на сегодня
          setStats(getDailyStats(sign));
          // Грузим текст
          await fetchDailyHoroscope(sign, profile.display_name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyHoroscope = async (sign: string, userName: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: existing } = await supabase
        .from('daily_horoscopes')
        .select('prediction_text')
        .eq('zodiac_sign', sign)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        setPrediction(existing.prediction_text);
      } else {
        setIsGenerating(true);
        const text = await generateDailyHoroscope(sign, userName);
        await supabase.from('daily_horoscopes').insert({ zodiac_sign: sign, date: today, prediction_text: text });
        setPrediction(text);
        setIsGenerating(false);
      }
    } catch (e) {
      setPrediction("Las estrellas están nubladas hoy.");
      setIsGenerating(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshStatus();
      if (isPremium) setIsUnlocked(true);
    }, [isPremium])
  );

  const handleUnlock = async () => {
    if (credits < 1) {
      setAlertConfig({
        visible: true,
        title: "Poca Energía",
        message: "Necesitas energía para revelar el destino.",
        icon: "flash"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (p) await supabase.from('profiles').update({ credits: p.credits - 1 }).eq('id', user.id);
        
        await refreshStatus();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsUnlocked(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const StatBar = ({ label, value, color, icon }: any) => (
    <View style={styles.statRow}>
      <View style={styles.statLabelContainer}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <LinearGradient
          colors={[color, '#fff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${value}%` }]}
        />
      </View>
      <Text style={styles.statValue}>{value}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#24243e']} style={StyleSheet.absoluteFill} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {name}</Text>
            <Text style={styles.zodiacText}>{zodiacSign || '...'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/energy')} style={styles.energyBadgeBtn}>
            <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.energyBadgeText}>{isPremium ? '∞' : credits}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.attributesContainer}>
           <View style={styles.attributeBox}>
              <Text style={styles.attrLabel}>NÚMERO</Text>
              <Text style={styles.attrValue}>{stats.luckyNumber || '-'}</Text>
           </View>
           <View style={[styles.attributeBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={styles.attrLabel}>COLOR</Text>
              <Text style={styles.attrValue} numberOfLines={1}>{stats.color || '-'}</Text>
           </View>
        </View>

        <View style={styles.statsCard}>
           <Text style={styles.statsTitle}>Tu Energía Hoy</Text>
           <StatBar label="Amor" value={stats.love} color="#FF6B6B" icon="heart" />
           <StatBar label="Salud" value={stats.health} color="#4ECDC4" icon="fitness" />
           <StatBar label="Dinero" value={stats.money} color="#FFD93D" icon="cash" />
        </View>

        <View style={styles.predictionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon" size={20} color="#ffd700" />
            <Text style={styles.cardTitle}>Mensaje de los Astros</Text>
          </View>
          
          <View style={[styles.textContainer, (!isUnlocked && !isPremium) && styles.textLocked]}>
             {isGenerating ? (
               <ActivityIndicator color="#FFD700" style={{ margin: 20 }} />
             ) : (
               <Text style={styles.predictionText}>
                 {/* ОЧИСТКА ТЕКСТА */}
                 {(!isUnlocked && !isPremium && prediction) 
                   ? cleanText(prediction).substring(0, 70) + '...' 
                   : cleanText(prediction) || "Conectando..."}
               </Text>
             )}

             {!isUnlocked && !isPremium && !isGenerating && prediction && (
               <View style={styles.lockOverlay}>
                 <LinearGradient colors={['transparent', '#0f0c29']} style={StyleSheet.absoluteFill} />
                 <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
                   <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.unlockGradient}>
                     <Ionicons name="lock-closed" size={18} color="#fff" />
                     <Text style={styles.unlockText}>Revelar (-1 ✨)</Text>
                   </LinearGradient>
                 </TouchableOpacity>
               </View>
             )}
          </View>
        </View>
        
        {/* 👇 БАННЕР ВСТАВЛЕН ЗДЕСЬ */}
        <AdBanner />
      </ScrollView>

      <MagicAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon as any}
        confirmText={alertConfig.title === "Poca Energía" ? "Ir a Tienda" : "Aceptar"}
        onConfirm={() => {
           if (alertConfig.title === "Poca Energía") router.push('/energy');
           setAlertConfig({ ...alertConfig, visible: false });
        }}
        onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c29' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#fff' },
  zodiacText: { fontSize: 18, color: '#A855F7', marginTop: 4, fontWeight: '600' },
  energyBadgeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  energyBadgeText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },

  attributesContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  attributeBox: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  attrLabel: { color: '#94A3B8', fontSize: 12, letterSpacing: 1, marginBottom: 5 },
  attrValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  statsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statsTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statLabelContainer: { flexDirection: 'row', alignItems: 'center', width: 85 },
  statLabel: { color: '#E2E8F0', marginLeft: 8, fontSize: 14 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', width: 35, textAlign: 'right' },

  predictionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 10 },
  textContainer: { position: 'relative', minHeight: 80 },
  textLocked: { maxHeight: 100, overflow: 'hidden' },
  predictionText: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.85)' },
  
  lockOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, justifyContent: 'flex-end', alignItems: 'center' },
  unlockButton: { width: '100%', borderRadius: 20, shadowColor: '#FFB800', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  unlockGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20 },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});