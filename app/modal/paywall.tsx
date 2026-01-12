import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../src/constants/Colors';
import { supabase } from '../../src/services/supabase';

export default function PaywallModal() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'lifetime'>('weekly');

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', session.user.id);

      if (error) throw error;

      setTimeout(() => {
        setIsLoading(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    console.log('Restore purchases');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0b2e', '#120d26', '#0a0612']}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerIcon}>✨</Text>
            <Text style={styles.headerTitle}>{t('paywall.header')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('paywall.subtitle')}
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem text={t('paywall.features.unlimitedInterpretations')} />
            <FeatureItem text={t('paywall.features.dailyHoroscope')} />
            <FeatureItem text={t('paywall.features.tarotReading')} />
            <FeatureItem text={t('paywall.features.dreamPatterns')} />
            <FeatureItem text={t('paywall.features.personalizedGuidance')} />
          </View>

          <View style={styles.pricingContainer}>
            <PricingCard
              title={t('paywall.pricing.lifetime.title')}
              price={t('paywall.pricing.lifetime.price')}
              subtitle={t('paywall.pricing.lifetime.subtitle')}
              isSelected={selectedPlan === 'lifetime'}
              onPress={() => setSelectedPlan('lifetime')}
              isAnchor
            />

            <PricingCard
              title={t('paywall.pricing.weekly.title')}
              price={t('paywall.pricing.weekly.price')}
              subtitle={t('paywall.pricing.weekly.subtitle')}
              badge={t('paywall.pricing.weekly.badge')}
              isSelected={selectedPlan === 'weekly'}
              onPress={() => setSelectedPlan('weekly')}
              isHighlighted
            />
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[Colors.accent.gold, Colors.accent.darkGold]}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.background.primary} />
                  <Text style={styles.ctaText}>{t('paywall.loadingText')}</Text>
                </View>
              ) : (
                <Text style={styles.ctaText}>{t('paywall.ctaButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.footerLink}>{t('paywall.footer.restore')}</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity>
              <Text style={styles.footerLink}>{t('paywall.footer.terms')}</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity>
              <Text style={styles.footerLink}>{t('paywall.footer.privacy')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            {t('paywall.disclaimer')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>✅</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  subtitle: string;
  badge?: string;
  isSelected: boolean;
  onPress: () => void;
  isHighlighted?: boolean;
  isAnchor?: boolean;
}

function PricingCard({
  title,
  price,
  subtitle,
  badge,
  isSelected,
  onPress,
  isHighlighted,
  isAnchor,
}: PricingCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pricingCard,
        isHighlighted && styles.pricingCardHighlighted,
        isAnchor && styles.pricingCardAnchor,
        isSelected && styles.pricingCardSelected,
      ]}
      onPress={onPress}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <View style={styles.pricingContent}>
        <Text style={[styles.pricingTitle, isAnchor && styles.pricingTitleAnchor]}>
          {title}
        </Text>
        <Text style={[styles.pricingPrice, isAnchor && styles.pricingPriceAnchor]}>
          {price}
        </Text>
        <Text style={[styles.pricingSubtitle, isAnchor && styles.pricingSubtitleAnchor]}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
          isHighlighted && isSelected && styles.radioButtonHighlighted,
        ]}
      >
        {isSelected && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: Colors.text.muted,
    fontWeight: '300',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.accent.gold,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  pricingContainer: {
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: 'rgba(107, 70, 193, 0.15)',
    borderWidth: 2,
    borderColor: Colors.ui.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  pricingCardHighlighted: {
    borderColor: Colors.accent.gold,
    backgroundColor: 'rgba(184, 148, 31, 0.1)',
  },
  pricingCardAnchor: {
    opacity: 0.6,
  },
  pricingCardSelected: {
    borderWidth: 3,
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.background.primary,
  },
  pricingContent: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  pricingTitleAnchor: {
    color: Colors.text.muted,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.accent.gold,
    marginBottom: 2,
  },
  pricingPriceAnchor: {
    color: Colors.text.muted,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  pricingSubtitleAnchor: {
    color: Colors.text.muted,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: Colors.accent.gold,
  },
  radioButtonHighlighted: {
    borderColor: Colors.accent.gold,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.gold,
  },
  ctaButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.text.muted,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.text.muted,
    marginHorizontal: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
