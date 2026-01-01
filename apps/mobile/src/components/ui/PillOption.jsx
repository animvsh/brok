import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import {
  GuitarIcon,
  DataBrainIcon,
  PsychologyIcon,
  FitnessIcon,
  SparkleIcon,
  LaptopIcon,
  LanguagesIcon,
  MathIcon,
  ScienceIcon,
  SmileIcon,
  GradCapIcon,
  BriefcaseIcon,
  SearchIcon,
  HeartIcon,
  TrophyIcon,
  EagleIcon,
  FrogIcon,
  DolphinIcon,
  BatIcon,
} from './TopicIcons';

// Custom emoji-style icon mapping
const EMOJI_ICON_MAP = {
  music: GuitarIcon,
  guitar: GuitarIcon,
  code: DataBrainIcon,
  'data-structures': DataBrainIcon,
  brain: PsychologyIcon,
  psychology: PsychologyIcon,
  dumbbell: FitnessIcon,
  fitness: FitnessIcon,
  laptop: LaptopIcon,
  programming: LaptopIcon,
  languages: LanguagesIcon,
  calculator: MathIcon,
  math: MathIcon,
  flask: ScienceIcon,
  science: ScienceIcon,
  sparkles: SparkleIcon,
  smile: SmileIcon,
  fun: SmileIcon,
  'graduation-cap': GradCapIcon,
  school: GradCapIcon,
  briefcase: BriefcaseIcon,
  career: BriefcaseIcon,
  search: SearchIcon,
  curiosity: SearchIcon,
  heart: HeartIcon,
  hobby: HeartIcon,
  trophy: TrophyIcon,
  challenge: TrophyIcon,
  eagle: EagleIcon,
  frog: FrogIcon,
  dolphin: DolphinIcon,
  bat: BatIcon,
};

/**
 * Pill-shaped option - white background with emoji icon on left
 * Matches Duolingo-style reference design
 */
export default function PillOption({
  label,
  icon = 'sparkles',
  selected = false,
  correct = null,
  locked = false,
  onPress,
  style,
  size = 'medium',
}) {
  const IconComponent = EMOJI_ICON_MAP[icon] || SparkleIcon;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 12, paddingHorizontal: 16, iconSize: 28, fontSize: 15 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 20, iconSize: 36, fontSize: 17 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 18, iconSize: 32, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  const getBorderColor = () => {
    if (correct === true) return '#4CAF50';
    if (correct === false) return '#F44336';
    if (selected) return '#2196F3';
    return '#E0E0E0';
  };

  const getBackgroundColor = () => {
    if (locked) return '#F8F8F8';
    if (correct === true) return '#E8F5E9';
    if (correct === false) return '#FFEBEE';
    if (selected) return '#E3F2FD';
    return 'white';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={locked || correct !== null}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        selected && styles.selectedShadow,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <IconComponent size={sizeStyles.iconSize} />
      </View>

      <Text
        style={[
          styles.label,
          { fontSize: sizeStyles.fontSize },
          locked && { color: COLORS.text.muted },
          correct === true && { color: '#2E7D32' },
          correct === false && { color: '#C62828' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {correct === true && (
        <View style={[styles.checkBadge, { backgroundColor: '#4CAF50' }]}>
          <Check size={14} color="white" strokeWidth={3} />
        </View>
      )}
      {locked && <Lock size={18} color={COLORS.text.muted} />}
    </TouchableOpacity>
  );
}

/**
 * Quiz option with animal icon - matches reference exactly
 */
export function QuizOption({
  label,
  optionLetter = 'A',
  selected = false,
  correct = null,
  onPress,
  style,
}) {
  const ANIMAL_ICONS = ['eagle', 'frog', 'dolphin', 'bat'];
  const iconIndex = ['A', 'B', 'C', 'D'].indexOf(optionLetter);
  const animalIcon = iconIndex >= 0 ? ANIMAL_ICONS[iconIndex] : 'eagle';
  const AnimalComponent = EMOJI_ICON_MAP[animalIcon] || EagleIcon;

  const getBorderColor = () => {
    if (correct === true) return '#4CAF50';
    if (correct === false) return '#F44336';
    if (selected) return '#2196F3';
    return '#E0E0E0';
  };

  const getBackgroundColor = () => {
    if (correct === true) return '#E8F5E9';
    if (correct === false) return '#FFEBEE';
    if (selected) return '#2196F3';
    return 'white';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={correct !== null}
      activeOpacity={0.7}
      style={[
        styles.quizContainer,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        selected && correct === null && styles.quizSelected,
        style,
      ]}
    >
      <View style={styles.quizIconContainer}>
        <AnimalComponent size={36} />
      </View>
      <Text
        style={[
          styles.quizLabel,
          selected && correct === null && { color: 'white' },
          correct === true && { color: '#2E7D32' },
          correct === false && { color: '#C62828' },
        ]}
      >
        {label}
      </Text>
      {correct === true && (
        <View style={[styles.checkBadge, { backgroundColor: '#4CAF50' }]}>
          <Check size={14} color="white" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Topic chip for horizontal scroll
 */
export function TopicChip({
  label,
  icon = 'sparkles',
  selected = false,
  onPress,
  style,
}) {
  const IconComponent = EMOJI_ICON_MAP[icon] || SparkleIcon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chipContainer, selected && styles.chipSelected, style]}
    >
      <IconComponent size={24} />
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    marginVertical: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    color: COLORS.text.primary,
  },
  selectedShadow: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quiz styles
  quizContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quizSelected: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quizIconContainer: {
    marginRight: 12,
  },
  quizLabel: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },

  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    gap: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  chipLabelSelected: {
    color: 'white',
  },
});
