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
        tabBarActiveTintColor: '#FFD700', 
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', 
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'android' ? 8 : 0,
        },
        tabBarStyle: {
          backgroundColor: '#0f0c29', 
          borderTopColor: 'rgba(255, 215, 0, 0.1)', 
          height: 70 + insets.bottom, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          elevation: 0, 
        },
      }}
    >
      <Tabs.Screen
        name="suenos"
        options={{
          title: 'Sueños', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "moon" : "moon-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="horoscope"
        options={{
          title: 'Horóscopo', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "star" : "star-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="oracle"
        options={{
          title: 'Oráculo', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}