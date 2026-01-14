import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRewardedAd } from '../hooks/useRewardedAd';

export default function WatchAdButton() {
  const { loaded, loading, showAd } = useRewardedAd();

  const handlePress = () => {
    if (loading) {
      return;
    }
    showAd();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        (loading || !loaded) && styles.containerDisabled
      ]}
      onPress={handlePress}
      disabled={loading || !loaded}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FF4E00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <View style={styles.content}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.text}>Загрузка...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Ionicons 
              name="play-circle" 
              size={24} 
              color="#fff" 
              style={styles.icon}
            />
            <Text style={styles.text}>Бесплатная энергия (+1 ✨)</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginVertical: 8,
  },
  containerDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
