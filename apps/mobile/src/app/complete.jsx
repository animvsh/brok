import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Flame, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const { width } = Dimensions.get('window');

// Confetti colors
const CONFETTI_COLORS = ['#FF9ECD', '#9AD8FF', '#FFD700', '#C9A8FF', '#7DD87D', '#FFB088'];

function Confetti({ delay, startX }) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(swayAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(swayAnim, { toValue: -1, duration: 500, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          transform: [
            {
              translateY: fallAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 800],
              }),
            },
            {
              translateX: swayAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: [-20, 20],
              }),
            },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity: fallAnim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0],
          }),
        },
      ]}
    />
  );
}

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { courseId, skillId, xp } = useLocalSearchParams();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim1 = useRef(new Animated.Value(0)).current;
  const badgeAnim2 = useRef(new Animated.Value(0)).current;
  const badgeAnim3 = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Title entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      // Badges stagger
      Animated.stagger(150, [
        Animated.spring(badgeAnim1, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(badgeAnim2, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(badgeAnim3, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      // Mascot
      Animated.spring(mascotAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  const xpEarned = parseInt(xp) || 60;
  const currentStreak = 5;

  const handleContinue = () => {
    if (courseId) {
      router.replace({ pathname: '/course', params: { courseId } });
    } else {
      router.replace('/home');
    }
  };

  // Generate confetti
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    startX: Math.random() * width,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFB347', '#FFCC33', '#FF9ECD', '#C9A8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <Confetti key={piece.id} delay={piece.delay} startX={piece.startX} />
      ))}

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          <Text style={styles.title}>Lesson</Text>
          <Text style={styles.titleBig}>Complete!</Text>
        </Animated.View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* XP Badge */}
          <Animated.View
            style={[
              styles.badge,
              styles.badgeXP,
              {
                transform: [
                  {
                    scale: badgeAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: badgeAnim1,
              },
            ]}
          >
            <Star size={20} color="#FFD700" fill="#FFD700" />
            <Text style={styles.badgeValue}>+{xpEarned} XP</Text>
          </Animated.View>

          {/* Streak Badge */}
          <Animated.View
            style={[
              styles.badge,
              styles.badgeStreak,
              {
                transform: [
                  {
                    scale: badgeAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: badgeAnim2,
              },
            ]}
          >
            <Flame size={20} color="#FF6B35" />
            <Text style={styles.badgeValue}>{currentStreak} Day Streak!</Text>
          </Animated.View>

          {/* Level Up Badge */}
          <Animated.View
            style={[
              styles.badge,
              styles.badgeLevelUp,
              {
                transform: [
                  {
                    scale: badgeAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: badgeAnim3,
              },
            ]}
          >
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.badgeValue}>Level Up!</Text>
          </Animated.View>
        </View>

        {/* Mascot */}
        <Animated.View
          style={[
            styles.mascotContainer,
            {
              transform: [
                {
                  scale: mascotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
                {
                  translateY: mascotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: mascotAnim,
            },
          ]}
        >
          <BrokMascot size={180} mood="celebrating" />
        </Animated.View>
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
    backgroundColor: '#FFB347',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleBig: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgesRow: {
    gap: 12,
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeXP: {
    backgroundColor: '#FFFBEB',
  },
  badgeStreak: {
    backgroundColor: '#FFF5F0',
  },
  badgeLevelUp: {
    backgroundColor: '#ECFDF5',
  },
  badgeValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  mascotContainer: {
    marginTop: 16,
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
