import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import {
  Check,
  X,
  Lock,
} from 'lucide-react-native';
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
  // Topic icons
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
  // Reason icons
  smile: SmileIcon,
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
  // Animal icons for quiz options
  eagle: EagleIcon,
  bird: EagleIcon,
  frog: FrogIcon,
  dolphin: DolphinIcon,
  fish: DolphinIcon,
  bat: BatIcon,
  bug: BatIcon,
};

/**
 * Pill-shaped option button with colorful emoji-style icon
 */
export default function PillOption({
  label,
  icon = 'sparkles',
  iconColor = COLORS.accent.purple,
  selected = false,
  correct = null, // null = not answered, true = correct, false = incorrect
  locked = false,
  onPress,
  style,
  size = 'medium', // small, medium, large
}) {
  const IconComponent = EMOJI_ICON_MAP[icon] || SparkleIcon;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 12, paddingHorizontal: 18, iconSize: 32, fontSize: 15 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 22, iconSize: 44, fontSize: 18 };
      case 'medium':
      default:
        return { paddingVertical: 14, paddingHorizontal: 20, iconSize: 38, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  const getBackgroundColor = () => {
    if (locked) return COLORS.pill.locked;
    if (correct === true) return '#E8F5E9';
    if (correct === false) return '#FFEBEE';
    if (selected) return COLORS.pill.selected;
    return COLORS.pill.unselected;
  };

  const getBorderColor = () => {
    if (correct === true) return COLORS.status.success;
    if (correct === false) return COLORS.status.error;
    if (selected) return COLORS.pill.selected;
    return 'rgba(0, 0, 0, 0.08)';
  };

  const getTextColor = () => {
    if (locked) return COLORS.text.muted;
    if (correct === true) return '#2E7D32';
    if (correct === false) return '#C62828';
    if (selected) return COLORS.text.light;
    return COLORS.text.primary;
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
          {
            color: getTextColor(),
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Status icons */}
      {correct === true && (
        <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
          <Check size={14} color="white" />
        </View>
      )}
      {correct === false && (
        <View style={[styles.statusIcon, { backgroundColor: '#F44336' }]}>
          <X size={14} color="white" />
        </View>
      )}
      {locked && (
        <Lock size={16} color={COLORS.text.muted} style={styles.lockIcon} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Circular icon button (for topic selection grid)
 */
export function TopicChip({
  label,
  icon = 'sparkles',
  iconColor = COLORS.accent.purple,
  selected = false,
  onPress,
  style,
}) {
  const IconComponent = EMOJI_ICON_MAP[icon] || SparkleIcon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chipContainer,
        selected && styles.chipSelected,
        style,
      ]}
    >
      <View style={styles.chipIconWrapper}>
        <IconComponent size={28} />
      </View>
      <Text
        style={[
          styles.chipLabel,
          selected && styles.chipLabelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Quiz option with animal icon for multiple choice
 */
export function QuizOption({
  label,
  optionLetter = 'A',
  icon = 'eagle',
  selected = false,
  correct = null,
  onPress,
  style,
}) {
  const IconComponent = EMOJI_ICON_MAP[icon] || EagleIcon;

  const ANIMAL_ICONS = ['eagle', 'frog', 'dolphin', 'bat'];
  const iconIndex = ['A', 'B', 'C', 'D'].indexOf(optionLetter);
  const animalIcon = iconIndex >= 0 ? ANIMAL_ICONS[iconIndex] : 'eagle';
  const AnimalComponent = EMOJI_ICON_MAP[animalIcon] || EagleIcon;

  const getBackgroundColor = () => {
    if (correct === true) return '#E8F5E9';
    if (correct === false) return '#FFEBEE';
    if (selected) return '#E3F2FD';
    return 'white';
  };

  const getBorderColor = () => {
    if (correct === true) return '#4CAF50';
    if (correct === false) return '#F44336';
    if (selected) return '#2196F3';
    return 'rgba(0, 0, 0, 0.08)';
  };

  const getTextColor = () => {
    if (correct === true) return '#2E7D32';
    if (correct === false) return '#C62828';
    return COLORS.text.primary;
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
        selected && styles.quizSelected,
        style,
      ]}
    >
      <View style={styles.quizIconContainer}>
        <AnimalComponent size={42} />
      </View>
      <Text
        style={[
          styles.quizLabel,
          { color: getTextColor() },
        ]}
      >
        {label}
      </Text>
      {correct === true && (
        <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
          <Check size={14} color="white" />
        </View>
      )}
      {correct === false && (
        <View style={[styles.statusIcon, { backgroundColor: '#F44336' }]}>
          <X size={14} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 2,
    marginVertical: 6,
  },
  iconContainer: {
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
  },
  selectedShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  lockIcon: {
    marginLeft: 8,
  },
  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIconWrapper: {
    marginRight: 10,
  },
  chipLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  chipLabelSelected: {
    color: 'white',
  },
  // Quiz option styles
  quizContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 6,
    backgroundColor: 'white',
  },
  quizSelected: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quizIconContainer: {
    marginRight: 14,
  },
  quizLabel: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
  },
});
