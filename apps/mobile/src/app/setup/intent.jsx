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
  Smile,
  GraduationCap,
  Briefcase,
  Search,
  ChevronRight,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const INTENT_OPTIONS = [
  { id: 'fun', label: 'Fun', icon: Smile, color: '#FFD54F', description: 'Just for enjoyment' },
  { id: 'school', label: 'School', icon: GraduationCap, color: '#64B5F6', description: 'Academic goals' },
  { id: 'career', label: 'Career', icon: Briefcase, color: '#7986CB', description: 'Professional growth' },
  { id: 'curiosity', label: 'Curiosity', icon: Search, color: '#BA68C8', description: 'Learning to explore' },
];

export default function IntentScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { topic } = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

  if (!fontsLoaded) return null;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (selected) {
      router.push({
        pathname: '/setup/intensity',
        params: { topic, intent: selected },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.progressDotInactive]} />
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
        <Text style={styles.title}>Why are you learning{'\n'}{topic}?</Text>

        <View style={styles.optionsContainer}>
          {INTENT_OPTIONS.map((option) => {
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
                  <Icon size={24} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <BrokMascot size={100} mood={selected ? 'excited' : 'happy'} />
        </View>
      </View>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <LinearGradient
            colors={selected ? [COLORS.primary, COLORS.primaryDark] : ['#CCCCCC', '#AAAAAA']}
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
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: 38,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDesc: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 24,
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
  continueButtonDisabled: {
    shadowOpacity: 0,
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
