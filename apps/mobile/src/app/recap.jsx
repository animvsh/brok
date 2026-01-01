import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Star,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Home,
  Map,
  Flame,
  Zap,
  Crown,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import GradientBackground from '@/components/ui/GradientBackground';
import BrokMascot from '@/components/mascot/BrokMascot';
import FloatingClouds from '@/components/ui/FloatingClouds';
import { COLORS, GRADIENTS } from '@/components/theme/colors';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Confetti particle component
function ConfettiParticle({ delay, color, startX }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 800, duration: 3000, useNativeDriver: true }),
          Animated.timing(translateX, {
            toValue: startX + (Math.random() - 0.5) * 100,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, { toValue: 360, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  );
}

// Confetti background
function Confetti() {
  const confettiColors = [
    COLORS.accent.pink,
    COLORS.accent.blue,
    COLORS.accent.purple,
    COLORS.xp.gold,
    COLORS.accent.orange,
    COLORS.brokGreen,
  ];

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    delay: i * 80,
    startX: Math.random() * width,
  }));

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} color={p.color} delay={p.delay} startX={p.startX} />
      ))}
    </View>
  );
}

// Achievement Badge Component
function AchievementBadge({ icon: Icon, iconColor, bgColor, title, value, subtitle }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.achievementBadge, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.achievementIcon, { backgroundColor: bgColor }]}>
        <Icon size={28} color={iconColor} fill={iconColor} />
      </View>
      <Text style={styles.achievementValue}>{value}</Text>
      <Text style={styles.achievementTitle}>{title}</Text>
      {subtitle && <Text style={styles.achievementSubtitle}>{subtitle}</Text>}
    </Animated.View>
  );
}

export default function RecapScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();
  const { threadId } = useLocalSearchParams();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -10, duration: 600, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  // Fetch graph data for summary
  const { data, isLoading } = useQuery({
    queryKey: ['recapData', threadId],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${API_URL}/api/graphs/visualize?threadId=${threadId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recap data');
      }

      return response.json();
    },
    enabled: !!threadId && !!session?.access_token,
  });

  const handleGoHome = () => router.replace('/home');
  const handleViewSkillMap = () => router.push({ pathname: '/skillmap', params: { threadId } });
  const handleContinuePractice = () => router.replace({ pathname: '/action', params: { threadId } });

  if (!fontsLoaded || isLoading) {
    return (
      <GradientBackground variant="celebration">
        <FloatingClouds variant="scattered" />
        <View style={styles.centered}>
          <BrokMascot size={100} mood="excited" />
          <Text style={styles.loadingText}>Calculating your progress...</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        </View>
      </GradientBackground>
    );
  }

  const { thread = {}, nodes = [], summary = {} } = data || {};

  const masteredNodes = nodes.filter((n) => n.mastery?.isMastered);
  const inProgressNodes = nodes.filter(
    (n) => !n.mastery?.isMastered && n.mastery?.evidenceCount > 0
  );

  const isComplete = summary.completionPercent === 100;

  // Calculate XP earned (mock - in real app this would come from backend)
  const xpEarned = (summary.masteredNodes || 0) * 50 + (summary.inProgressNodes || 0) * 10;
  const streakDays = 3; // Mock streak value
  const currentLevel = Math.floor(xpEarned / 100) + 1;
  const leveledUp = true; // Mock level up

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={isComplete ? GRADIENTS.celebration : GRADIENTS.warmSunset}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating clouds for playful feel */}
      <FloatingClouds variant="bottom" />

      {/* Confetti for celebration */}
      <Confetti />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: bounceAnim }] }}>
            <BrokMascot size={140} mood={isComplete ? 'celebrating' : 'excited'} />
          </Animated.View>

          <Text style={styles.title}>
            {isComplete ? 'Amazing!' : 'Great Job!'}
          </Text>

          <Text style={styles.subtitle}>
            {isComplete
              ? `You've mastered all skills!`
              : `You're making incredible progress!`}
          </Text>
        </View>

        {/* Achievement Badges Row */}
        <View style={styles.achievementsRow}>
          <AchievementBadge
            icon={Star}
            iconColor={COLORS.xp.gold}
            bgColor={`${COLORS.xp.gold}25`}
            title="XP Earned"
            value={`+${xpEarned}`}
          />

          <AchievementBadge
            icon={Flame}
            iconColor={COLORS.streak.fire}
            bgColor={`${COLORS.streak.fire}25`}
            title="Day Streak"
            value={streakDays}
            subtitle="Keep it up!"
          />

          {leveledUp && (
            <AchievementBadge
              icon={Crown}
              iconColor="#9B59B6"
              bgColor="#9B59B620"
              title="Level Up!"
              value={`Lv ${currentLevel}`}
            />
          )}
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Trophy size={24} color={COLORS.xp.gold} />
            <Text style={styles.progressHeaderText}>Session Progress</Text>
          </View>

          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <LinearGradient
                colors={GRADIENTS.successGreen}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[styles.progressCircleFill, { height: `${summary.completionPercent || 0}%` }]}
              />
              <View style={styles.progressCircleInner}>
                <Text style={styles.progressPercent}>{summary.completionPercent || 0}%</Text>
                <Text style={styles.progressLabel}>Complete</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <CheckCircle size={20} color={COLORS.status.success} />
              <Text style={styles.statValue}>{summary.masteredNodes || 0}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <TrendingUp size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{summary.inProgressNodes || 0}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Star size={20} color={COLORS.xp.gold} />
              <Text style={styles.statValue}>{summary.totalNodes || 0}</Text>
              <Text style={styles.statLabel}>Total Skills</Text>
            </View>
          </View>
        </View>

        {/* Mastered Skills */}
        {masteredNodes.length > 0 && (
          <View style={styles.skillsCard}>
            <View style={styles.skillsHeader}>
              <Trophy size={20} color={COLORS.xp.gold} />
              <Text style={styles.skillsTitle}>Skills Mastered</Text>
            </View>
            <View style={styles.skillsList}>
              {masteredNodes.slice(0, 5).map((node) => (
                <View key={node.id} style={styles.skillPill}>
                  <CheckCircle size={14} color={COLORS.status.success} />
                  <Text style={styles.skillPillText}>{node.name}</Text>
                </View>
              ))}
            </View>
            {masteredNodes.length > 5 && (
              <Text style={styles.moreSkills}>
                +{masteredNodes.length - 5} more mastered!
              </Text>
            )}
          </View>
        )}

        {/* Keep Practicing */}
        {inProgressNodes.length > 0 && !isComplete && (
          <View style={styles.practiceCard}>
            <View style={styles.practiceHeader}>
              <Zap size={20} color={COLORS.streak.fire} />
              <Text style={styles.practiceTitle}>Almost There!</Text>
            </View>
            <Text style={styles.practiceText}>
              {inProgressNodes.length} skill{inProgressNodes.length > 1 ? 's' : ''} almost ready to master!
            </Text>
            {inProgressNodes.slice(0, 3).map((node) => (
              <View key={node.id} style={styles.practiceItem}>
                <Text style={styles.practiceSkillName}>{node.name}</Text>
                <View style={styles.miniProgress}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.miniProgressFill,
                      { width: `${(node.mastery?.p || 0) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <BrokMascot size={60} mood="encouraging" />
          <Text style={styles.motivationText}>
            {isComplete
              ? "You're amazing! Ready for a new adventure?"
              : "Every session brings you closer to mastery!"}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}>
        {!isComplete && (
          <TouchableOpacity onPress={handleContinuePractice} style={styles.primaryButton}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Zap size={22} color="white" />
              <Text style={styles.primaryButtonText}>Continue Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryButtons}>
          <TouchableOpacity onPress={handleViewSkillMap} style={styles.secondaryButton}>
            <Map size={20} color={COLORS.primary} />
            <Text style={[styles.secondaryButtonText, { color: COLORS.primary }]}>Skill Map</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGoHome} style={styles.secondaryButton}>
            <Home size={20} color={COLORS.text.primary} />
            <Text style={styles.secondaryButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 38,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 17,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Achievements Row
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
  },
  achievementBadge: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minWidth: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: COLORS.text.primary,
  },
  achievementTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  achievementSubtitle: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 10,
    color: COLORS.text.muted,
    marginTop: 2,
  },

  // Progress Card
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  progressHeaderText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E8F5E9',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressCircleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressCircleInner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    margin: 14,
    borderRadius: 58,
  },
  progressPercent: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: COLORS.status.success,
  },
  progressLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },

  // Skills Cards
  skillsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  skillsTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.status.success}15`,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  skillPillText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 13,
    color: COLORS.status.success,
  },
  moreSkills: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 13,
    color: COLORS.status.success,
    marginTop: 12,
    textAlign: 'center',
  },

  // Practice Card
  practiceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: `${COLORS.streak.fire}30`,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  practiceTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORS.streak.fire,
  },
  practiceText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  practiceItem: {
    marginBottom: 12,
  },
  practiceSkillName: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  miniProgress: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Motivation
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  motivationText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },

  // Buttons
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryButton: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: 'white',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 50,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
  },
});
