import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Flame, Check, ChevronRight, Coffee } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { threadId, nodeId } = useLocalSearchParams();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.spring(xpAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(streakAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  const xpEarned = 25;
  const currentStreak = 3;
  const lessonTitle = 'Arrays Basics';

  const handleContinue = () => {
    router.replace({ pathname: '/home', params: { threadId } });
  };

  const handleTakeBreak = () => {
    router.replace({ pathname: '/home', params: { threadId } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F0FFF0', '#E8F5E9', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View style={[
          styles.successCircle,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}>
          <Check size={48} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: opacityAnim }]}>
          Lesson Complete
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: opacityAnim }]}>
          {lessonTitle}
        </Animated.Text>

        <View style={styles.statsRow}>
          <Animated.View style={[
            styles.statCard,
            { transform: [{ scale: xpAnim }], opacity: xpAnim },
          ]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.xp.gold}20` }]}>
              <Star size={24} color={COLORS.xp.gold} fill={COLORS.xp.gold} />
            </View>
            <Text style={styles.statValue}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP earned</Text>
          </Animated.View>

          <Animated.View style={[
            styles.statCard,
            { transform: [{ scale: streakAnim }], opacity: streakAnim },
          ]}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.streak.fire}20` }]}>
              <Flame size={24} color={COLORS.streak.fire} />
            </View>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.progressContainer, { opacity: opacityAnim }]}>
          <View style={styles.progressRing}>
            <View style={styles.progressRingInner}>
              <Text style={styles.progressPercent}>40%</Text>
              <Text style={styles.progressLabel}>mastered</Text>
            </View>
          </View>
        </Animated.View>
      </View>

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

        <TouchableOpacity style={styles.breakButton} onPress={handleTakeBreak}>
          <Coffee size={18} color={COLORS.text.secondary} />
          <Text style={styles.breakText}>Take a break</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFF0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.status.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: `${COLORS.status.success}30`,
    borderTopColor: COLORS.status.success,
    borderRightColor: COLORS.status.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    alignItems: 'center',
  },
  progressPercent: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
  },
  progressLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    gap: 12,
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
  breakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  breakText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: COLORS.text.secondary,
  },
});
