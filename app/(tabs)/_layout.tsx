import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Цвета обновлены под "Золотую/Магическую" тему
        tabBarActiveTintColor: '#FFD700', // Золотой активный
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // Полупрозрачный белый
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'android' ? 8 : 0,
        },
        tabBarStyle: {
          backgroundColor: '#0f0c29', // Глубокий темно-синий (как на фонах экранов)
          borderTopColor: 'rgba(255, 215, 0, 0.1)', // Тонкая золотая линия сверху
          height: 70 + insets.bottom, // Чуть компактнее
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          elevation: 0, // Убираем тень на Android для чистого вида
        },
      }}
    >
      <Tabs.Screen
        name="suenos"
        options={{
          title: 'Sueños', // Перевод
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "moon" : "moon-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="horoscope"
        options={{
          title: 'Horóscopo', // Перевод
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "star" : "star-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="oracle"
        options={{
          title: 'Oráculo', // Перевод
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}