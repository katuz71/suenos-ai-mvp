import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ZodiacScreen() {
  const router = useRouter();
  const { name, date } = useLocalSearchParams<{ name: string; date: string }>();

  const calculateZodiac = (dateStr: string): string => {
    if (!dateStr) return 'Desconocido';
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 'Desconocido';
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    
    if (isNaN(day) || isNaN(month)) return 'Desconocido';
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Tauro';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Géminis';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cáncer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitario';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricornio';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Acuario';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Piscis';
    
    return 'Desconocido';
  };

  const zodiacSign = calculateZodiac(date || '');
  const zodiacEmojis: { [key: string]: string } = {
    'Aries': '♈',
    'Tauro': '♉',
    'Géminis': '♊',
    'Cáncer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Escorpio': '♏',
    'Sagitario': '♐',
    'Capricornio': '♑',
    'Acuario': '♒',
    'Piscis': '♓',
    'Desconocido': '❓'
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{zodiacEmojis[zodiacSign]}</Text>
        <Text style={styles.welcome}>Bienvenido, {name || 'Viajero'}</Text>
        <Text style={styles.sign}>Tu signo: {zodiacSign}</Text>
        <Text style={styles.description}>
          Las estrellas se han alineado para revelar tu destino. 
          Tu energía astral resuena con las fuerzas cósmicas del universo.
        </Text>
        <Text style={styles.mysticalText}>
          ✨ Luna está esperando para guiarte a través de los misterios de tus sueños...
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/(tabs)/suenos')}
        >
          <Text style={styles.buttonText}>Consultar a Luna</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 10,
  },
  sign: {
    fontSize: 24,
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  mysticalText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
