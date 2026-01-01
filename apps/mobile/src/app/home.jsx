import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flame,
  Star,
  Play,
  Plus,
  BookOpen,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Sample active courses
const SAMPLE_COURSES = [
  {
    id: '1',
    title: 'Data Structures',
    progress: 45,
    nextLesson: 'Arrays Basics',
    color: '#6366F1',
  },
  {
    id: '2',
    title: 'Spanish',
    progress: 20,
    nextLesson: 'Basic Greetings',
    color: '#EC4899',
  },
];

function CourseCard({ course, onPress }) {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.courseIcon, { backgroundColor: `${course.color}20` }]}>
        <BookOpen size={24} color={course.color} />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseNext}>Next: {course.nextLesson}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${course.progress}%`, backgroundColor: course.color }]} />
        </View>
      </View>
      <View style={styles.courseArrow}>
        <ChevronRight size={20} color={COLORS.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user } = useAuth();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { streak: 3, xp: 450 };
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data || { streak: 3, xp: 450 };
    },
    enabled: !!user?.id,
  });

  // Fetch active courses
  const { data: coursesData } = useQuery({
    queryKey: ['activeCourses', user?.id],
    queryFn: async () => {
      if (!user?.id) return SAMPLE_COURSES;
      const { data } = await supabase
        .from('learning_threads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });
      return data?.length ? data : SAMPLE_COURSES;
    },
    enabled: !!user?.id,
  });

  if (!fontsLoaded) return null;

  const streak = stats?.streak || stats?.current_streak || 3;
  const xp = stats?.xp || stats?.total_xp || 450;
  const courses = coursesData || SAMPLE_COURSES;
  const hasCourses = courses.length > 0;

  const handleContinueLearning = () => {
    if (courses[0]) {
      router.push({
        pathname: '/course',
        params: { courseId: courses[0].id },
      });
    }
  };

  const handleLearnNew = () => {
    router.push('/discover');
  };

  const handleCoursePress = (course) => {
    router.push({
      pathname: '/course',
      params: { courseId: course.id },
    });
  };

  const handleProfile = () => {
    router.push('/profile');
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

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Ready to learn?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <User size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBadge, styles.statBadgeStreak]}>
          <Flame size={18} color="#FF6B35" />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        <View style={[styles.statBadge, styles.statBadgeXP]}>
          <Star size={18} color="#FFD700" fill="#FFD700" />
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>total XP</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Actions */}
        <View style={styles.actionsContainer}>
          {/* Continue Learning */}
          {hasCourses && (
            <TouchableOpacity style={styles.continueCard} onPress={handleContinueLearning}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.continueGradient}
              >
                <View style={styles.continueContent}>
                  <View style={styles.continueIcon}>
                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <View style={styles.continueText}>
                    <Text style={styles.continueTitle}>Continue Learning</Text>
                    <Text style={styles.continueSubtitle}>{courses[0]?.title}</Text>
                  </View>
                </View>
                <ChevronRight size={24} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Learn Something New */}
          <TouchableOpacity style={styles.newCard} onPress={handleLearnNew}>
            <View style={styles.newIcon}>
              <Plus size={24} color={COLORS.primary} />
            </View>
            <View style={styles.newText}>
              <Text style={styles.newTitle}>Learn Something New</Text>
              <Text style={styles.newSubtitle}>Explore any topic</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Active Courses */}
        {hasCourses && (
          <View style={styles.coursesSection}>
            <Text style={styles.sectionTitle}>Your Courses</Text>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => handleCoursePress(course)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!hasCourses && (
          <View style={styles.emptyState}>
            <BrokMascot size={140} mood="encouraging" />
            <Text style={styles.emptyTitle}>Start your journey!</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Learn Something New" to begin
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBadgeStreak: {
    backgroundColor: '#FFF5F0',
  },
  statBadgeXP: {
    backgroundColor: '#FFFBEB',
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  continueCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  continueIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {},
  continueTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  continueSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  newCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  newIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  newText: {
    flex: 1,
  },
  newTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  newSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  coursesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  courseNext: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  courseArrow: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
