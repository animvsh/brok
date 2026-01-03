import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Coffee,
  Zap,
  Flame,
  ChevronRight,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const INTENSITY_OPTIONS = [
  {
    id: 'chill',
    label: 'Chill',
    icon: Coffee,
    color: '#4DB6AC',
    description: '5 min/day • Relaxed pace',
    emoji: '😌',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: Zap,
    color: '#FFB74D',
    description: '10 min/day • Steady progress',
    emoji: '💪',
  },
  {
    id: 'intense',
    label: 'Intense',
    icon: Flame,
    color: '#FF7043',
    description: '20 min/day • Fast mastery',
    emoji: '🔥',
  },
];

export default function IntensityScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { topic, intent } = useLocalSearchParams();
  const [selected, setSelected] = useState('balanced');

  if (!fontsLoaded) return null;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push({
      pathname: '/setup/skillcheck',
      params: { topic, intent, intensity: selected },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.progressDotInactive]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>How intense?</Text>
        <Text style={styles.subtitle}>You can change this anytime</Text>

        <View style={styles.optionsContainer}>
          {INTENSITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                  <Icon size={26} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  </View>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.radioOuter}>
                    <View style={styles.radioInner} />
                  </View>
                )}
                {!isSelected && <View style={styles.radioOuterEmpty} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <BrokMascot
            size={110}
            mood={selected === 'intense' ? 'excited' : selected === 'chill' ? 'happy' : 'encouraging'}
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  progressDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionDesc: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioOuterEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666666',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  continueText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
