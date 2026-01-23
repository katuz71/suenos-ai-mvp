import { Platform } from 'react-native';

export const THEME = {
  // Цвета
  colors: {
    bg: '#0f0c29',
    gold: '#FFD700',
    purple: '#A855F7',
    text: '#fff',
    textDim: 'rgba(255, 255, 255, 0.7)',
  },
  // Шрифты
  fonts: {
    // Мистический шрифт с засечками (как на онбординге)
    serif: Platform.select({ ios: 'Georgia', android: 'serif' }),
    // Обычный шрифт оставим системным (по умолчанию)
  }
};