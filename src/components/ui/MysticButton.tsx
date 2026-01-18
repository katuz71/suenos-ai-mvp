import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface MysticButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const MysticButton: React.FC<MysticButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'filled',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        variant === 'filled' ? styles.filled : styles.outlined,
        isDisabled && styles.disabled,
        loading && styles.loading,
        style,
      ]}
      activeOpacity={loading ? 0.7 : 0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'outlined' && styles.outlinedText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 2,
  },
  filled: {
    backgroundColor: Colors.accent.gold,
    borderColor: Colors.accent.gold,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: Colors.accent.gold,
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.7,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background.primary,
    letterSpacing: 0.5,
  },
  outlinedText: {
    color: Colors.accent.gold,
  },
});
