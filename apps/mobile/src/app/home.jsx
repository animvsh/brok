import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flame,
  Heart,
  Target,
  Play,
  Lock,
  BookOpen,
  Brain,
  Zap,
  Dna,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Sample path nodes
const SAMPLE_PATH = [
  { id: 1, type: 'intro', title: 'Intro Lesson', status: 'current', icon: BookOpen, color: '#6366F1' },
  { id: 2, type: 'locked', title: 'Locked', status: 'locked', icon: Lock, color: '#9CA3AF' },
  { id: 3, type: 'concept', title: 'Warm-Blooded', status: 'locked', icon: Brain, color: '#EC4899' },
  { id: 4, type: 'concept', title: 'Evolution', status: 'locked', icon: Dna, color: '#8B5CF6' },
];

function LessonPill({ node, onPress }) {
  const Icon = node.icon;
  const isLocked = node.status === 'locked';
  const isCurrent = node.status === 'current';

  return (
    <TouchableOpacity
      style={[
        styles.lessonPill,
        isCurrent && styles.lessonPillCurrent,
        isLocked && styles.lessonPillLocked,
      ]}
      onPress={() => !isLocked && onPress(node)}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isLocked ? ['#F3F4F6', '#E5E7EB'] : [node.color, `${node.color}DD`]}
        style={styles.lessonPillGradient}
      >
        <View style={styles.lessonPillIcon}>
          <Icon size={20} color={isLocked ? '#9CA3AF' : '#FFFFFF'} />
        </View>
        <Text style={[
          styles.lessonPillText,
          isLocked && styles.lessonPillTextLocked,
        ]}>
          {node.title}
        </Text>
        {isCurrent && (
          <View style={styles.playBadge}>
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user, session } = useAuth();
  const { threadId } = useLocalSearchParams();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data || { total_xp: 0, current_streak: 3, hearts: 5 };
    },
    enabled: !!user?.id,
  });

  // Fetch today's path
  const { data: pathData, isLoading } = useQuery({
    queryKey: ['todaysPath', threadId],
    queryFn: async () => {
      if (!threadId || !session?.access_token) return { nodes: SAMPLE_PATH };

      try {
        const response = await fetch(
          `${API_URL}/api/threads/${threadId}/next`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          return { nodes: data.pathNodes || SAMPLE_PATH };
        }
      } catch (e) {
        console.error('Error fetching path:', e);
      }
      return { nodes: SAMPLE_PATH };
    },
    enabled: !!user?.id,
  });

  if (!fontsLoaded) return null;

  const streak = stats?.current_streak || 3;
  const hearts = stats?.hearts || 5;
  const pathNodes = pathData?.nodes || SAMPLE_PATH;

  const handleLessonPress = (node) => {
    router.push({
      pathname: '/lesson',
      params: { threadId, nodeId: node.id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#E8D5FF', '#D5E5FF', '#E0F4FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cloud decorations */}
      <View style={[styles.cloud, styles.cloud1]} />
      <View style={[styles.cloud, styles.cloud2]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Mission</Text>
        <View style={styles.statsRow}>
          {/* Streak */}
          <View style={[styles.statBadge, styles.statBadgeStreak]}>
            <Flame size={16} color="#FF6B35" />
            <Text style={styles.statValue}>{streak}</Text>
          </View>
          {/* Hearts */}
          <View style={[styles.statBadge, styles.statBadgeHearts]}>
            <Heart size={16} color="#EC4899" fill="#EC4899" />
            <Text style={styles.statValue}>{hearts}</Text>
          </View>
          {/* Target */}
          <View style={[styles.statBadge, styles.statBadgeTarget]}>
            <Target size={16} color="#10B981" />
          </View>
        </View>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Lesson Pills */}
          <View style={styles.lessonsContainer}>
            {pathNodes.map((node, index) => (
              <LessonPill
                key={node.id}
                node={node}
                onPress={handleLessonPress}
              />
            ))}
          </View>

          {/* Mascot with calendar */}
          <View style={styles.mascotSection}>
            <BrokMascot size={140} mood="encouraging" />

            {/* Mini Calendar */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarMonth}>MON TUE WED THU FRI SAT SUN</Text>
              </View>
              <View style={styles.calendarDays}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.calendarDay,
                      day <= streak && styles.calendarDayActive,
                    ]}
                  >
                    {day <= streak ? (
                      <Text style={styles.calendarDayCheck}>✓</Text>
                    ) : (
                      <Text style={styles.calendarDayNumber}>{day}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Start Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            const currentNode = pathNodes.find(n => n.status === 'current');
            if (currentNode) handleLessonPress(currentNode);
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.startGradient}
          >
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startText}>Start Lesson</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5FF',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 100,
  },
  cloud1: {
    width: 150,
    height: 60,
    top: 100,
    right: -40,
  },
  cloud2: {
    width: 100,
    height: 40,
    top: 180,
    left: -20,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBadgeStreak: {
    backgroundColor: '#FFF5F0',
  },
  statBadgeHearts: {
    backgroundColor: '#FFF0F5',
  },
  statBadgeTarget: {
    backgroundColor: '#F0FFF5',
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  lessonsContainer: {
    gap: 12,
  },
  lessonPill: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonPillCurrent: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lessonPillLocked: {
    opacity: 0.7,
  },
  lessonPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  lessonPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  lessonPillText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  lessonPillTextLocked: {
    color: '#6B7280',
  },
  playBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginTop: 32,
    gap: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    marginBottom: 12,
  },
  calendarMonth: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 10,
    color: COLORS.text.muted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#7DD87D',
  },
  calendarDayNumber: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.muted,
  },
  calendarDayCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  startButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
