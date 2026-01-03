import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Image,
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
  Zap,
  ArrowUpRight,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { api } from '@/lib/api';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Category options
const CATEGORIES = ['All', 'Design', 'Illustration', 'Marketing', 'Music', 'Development'];

// Course card colors (vibrant)
const COURSE_CARD_COLORS = [
  { bg: '#3B82F6', icon: '#2563EB' }, // Blue
  { bg: '#F97316', icon: '#EA580C' }, // Orange
  { bg: '#EC4899', icon: '#DB2777' }, // Pink
  { bg: '#A855F7', icon: '#9333EA' }, // Purple
  { bg: '#14B8A6', icon: '#0D9488' }, // Teal
  { bg: '#6366F1', icon: '#4F46E5' }, // Indigo
];

function ColorfulCourseCard({ course, progress = 0, onPress, index = 0 }) {
  const colorIndex = index % COURSE_CARD_COLORS.length;
  const colors = COURSE_CARD_COLORS[colorIndex];
  const moduleCount = course.total_modules || 0;

  return (
    <TouchableOpacity
      style={[styles.colorfulCourseCard, { backgroundColor: colors.bg }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.colorfulCardContent}>
        <View style={styles.colorfulCardHeader}>
          <View style={[styles.colorfulCardIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <BookOpen size={20} color="#FFFFFF" />
          </View>
          <View style={styles.colorfulCardBadge}>
            <Zap size={12} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.colorfulCardBadgeText}>{moduleCount}</Text>
          </View>
        </View>
        <View style={styles.colorfulCardFooter}>
          <Text style={styles.colorfulCardTitle} numberOfLines={2}>
            {course.title}
          </Text>
          <View style={styles.colorfulCardArrow}>
            <ArrowUpRight size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CourseCard({ course, progress = 0, onPress }) {
  // Generate a consistent color based on course ID
  const colors = [COLORS.primary, '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
  const colorIndex = parseInt(course.id?.slice(0, 2) || '0', 16) % colors.length;
  const courseColor = colors[colorIndex];

  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.courseIcon, { backgroundColor: `${courseColor}20` }]}>
        <BookOpen size={24} color={courseColor} />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
        <Text style={styles.courseNext}>
          {course.total_modules || 0} modules • {progress}% complete
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: courseColor }]} />
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
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch user stats from API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      try {
        const data = await api.progress.stats();
        return data;
      } catch (error) {
        console.log('Stats fetch error (using defaults):', error.message);
        return { streak: 0, xp: 0 };
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch user's courses from database
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['userCourses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.log('Courses fetch error:', error.message);
          return [];
        }

        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          (courses || []).map(async (course) => {
            // Get total modules for this course
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', course.id);

            // Get completed modules for this user
            const moduleIds = modules?.map((m) => m.id) || [];
            let completedCount = 0;
            if (moduleIds.length > 0) {
              const { data: completions } = await supabase
                .from('module_completions')
                .select('module_id')
                .eq('user_id', user.id)
                .in('module_id', moduleIds);
              completedCount = completions?.length || 0;
            }

            const totalModules = modules?.length || course.total_modules || 1;
            const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

            return {
              ...course,
              progress,
            };
          })
        );

        return coursesWithProgress;
      } catch (error) {
        console.log('Courses fetch error:', error.message);
        return [];
      }
    },
    enabled: isAuthenticated && !!user?.id,
  });

  if (!fontsLoaded) return null;

  const streak = stats?.streak || stats?.current_streak || 0;
  const xp = stats?.xp || stats?.total_xp || 0;
  const courses = coursesData || [];
  const hasCourses = courses.length > 0;

  // Get user's display name (fallback to email or "User")
  const displayName = user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'User';

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
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {displayName}</Text>
          <View style={styles.membershipBadge}>
            <View style={styles.membershipDot} />
            <Text style={styles.membershipText}>Basic member</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <User size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Your Courses Section */}
        <View style={styles.yourCoursesSection}>
          <Text style={styles.yourCoursesTitle}>Your Courses</Text>
          
          {/* Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryPill,
                  selectedCategory === category && styles.categoryPillSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === category && styles.categoryPillTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Colorful Course Cards */}
          {hasCourses && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.coursesScroll}
              contentContainerStyle={styles.coursesContainer}
            >
              {courses.map((course, index) => (
                <ColorfulCourseCard
                  key={course.id}
                  course={course}
                  progress={course.progress || 0}
                  onPress={() => handleCoursePress(course)}
                  index={index}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Learn Something New */}
        <TouchableOpacity style={styles.learnNewCard} onPress={handleLearnNew}>
          <View style={styles.learnNewIcon}>
            <Plus size={24} color="#FFFFFF" />
          </View>
          <View style={styles.learnNewText}>
            <Text style={styles.learnNewTitle}>Learn Something New</Text>
            <Text style={styles.learnNewSubtitle}>Explore any topic</Text>
          </View>
          <ChevronRight size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>

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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  membershipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  membershipText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: '#B0B0B0',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  yourCoursesSection: {
    marginBottom: 32,
  },
  yourCoursesTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 10,
    paddingRight: 24,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryPillSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryPillText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist_600SemiBold',
  },
  coursesScroll: {
    marginTop: 8,
  },
  coursesContainer: {
    gap: 16,
    paddingRight: 24,
  },
  colorfulCourseCard: {
    width: 160,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  colorfulCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  colorfulCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  colorfulCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorfulCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  colorfulCardBadgeText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  colorfulCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  colorfulCardTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  colorfulCardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  learnNewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  learnNewText: {
    flex: 1,
  },
  learnNewTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  learnNewSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Legacy styles (keeping for compatibility)
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#FFFFFF',
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
    backgroundColor: '#2A2A2A',
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
});
