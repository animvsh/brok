import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap, Star, Trophy } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/**
 * XP Badge - Shows experience points gained
 */
export function XPBadge({ amount, size = 'medium', style }) {
  const isPositive = amount > 0;
  const sizeStyles = {
    small: { paddingH: 8, paddingV: 4, fontSize: 12, iconSize: 12 },
    medium: { paddingH: 12, paddingV: 6, fontSize: 16, iconSize: 16 },
    large: { paddingH: 16, paddingV: 10, fontSize: 24, iconSize: 22 },
  }[size];

  return (
    <LinearGradient
      colors={isPositive ? ['#FFD700', '#FFA500'] : ['#AAAAAA', '#888888']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.xpBadge,
        {
          paddingHorizontal: sizeStyles.paddingH,
          paddingVertical: sizeStyles.paddingV,
        },
        style,
      ]}
    >
      <Star size={sizeStyles.iconSize} color="white" fill="white" />
      <Text style={[styles.xpText, { fontSize: sizeStyles.fontSize }]}>
        {isPositive ? '+' : ''}{amount} XP
      </Text>
    </LinearGradient>
  );
}

/**
 * Streak Badge - Shows current streak
 */
export function StreakBadge({ days, style }) {
  return (
    <View style={[styles.streakBadge, style]}>
      <Flame size={18} color={COLORS.streak.fire} fill={COLORS.streak.flame} />
      <Text style={styles.streakText}>{days}</Text>
    </View>
  );
}

/**
 * Level Badge - Shows current level
 */
export function LevelBadge({ level, style }) {
  return (
    <LinearGradient
      colors={['#9B59B6', '#8E44AD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.levelBadge, style]}
    >
      <Trophy size={14} color="white" />
      <Text style={styles.levelText}>Lvl {level}</Text>
    </LinearGradient>
  );
}

/**
 * Stats Row - Shows XP, streak, and level together
 */
export function StatsRow({ xp, streak, level, style }) {
  return (
    <View style={[styles.statsRow, style]}>
      {streak > 0 && <StreakBadge days={streak} />}
      {level && <LevelBadge level={level} />}
      <View style={styles.xpContainer}>
        <Zap size={16} color={COLORS.xp.gold} fill={COLORS.xp.gold} />
        <Text style={styles.xpTotal}>{xp?.toLocaleString() || 0}</Text>
      </View>
    </View>
  );
}

/**
 * Achievement Pill - For showing achievements/milestones
 */
export function AchievementPill({ label, icon = 'star', color = '#FFD700', style }) {
  const IconComponent = icon === 'flame' ? Flame : icon === 'trophy' ? Trophy : Star;

  return (
    <LinearGradient
      colors={[color, adjustColor(color, -20)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.achievementPill, style]}
    >
      <IconComponent size={14} color="white" fill="white" />
      <Text style={styles.achievementText}>{label}</Text>
    </LinearGradient>
  );
}

// Helper to darken a color
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    gap: 4,
  },
  xpText: {
    fontFamily: 'Montserrat_700Bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  streakText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORS.streak.fire,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  levelText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpTotal: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  achievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  achievementText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: 'white',
  },
});

export default { XPBadge, StreakBadge, LevelBadge, StatsRow, AchievementPill };
