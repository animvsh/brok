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
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Play,
  Map,
  RotateCcw,
  Flame,
  Target,
  ChevronRight,
  BookOpen,
  Brain,
  Lock,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Sample course data
const SAMPLE_COURSE = {
  id: '1',
  title: 'Data Structures',
  progress: 45,
  streak: 5,
  dailyGoal: '10 min',
  skills: [
    { id: 1, name: 'Arrays', mastery: 0.8, status: 'mastered' },
    { id: 2, name: 'Linked Lists', mastery: 0.5, status: 'learning' },
    { id: 3, name: 'Stacks', mastery: 0.2, status: 'started' },
    { id: 4, name: 'Queues', mastery: 0, status: 'locked' },
    { id: 5, name: 'Trees', mastery: 0, status: 'locked' },
  ],
  nextLesson: {
    title: 'Linked List Operations',
    type: 'learn',
    time: '5 min',
  },
};

function SkillPill({ skill }) {
  const isLocked = skill.status === 'locked';
  const isMastered = skill.status === 'mastered';

  return (
    <View style={[styles.skillPill, isLocked && styles.skillPillLocked]}>
      <View style={[
        styles.skillMastery,
        { width: `${skill.mastery * 100}%` },
        isMastered && styles.skillMasteryComplete,
      ]} />
      <Text style={[styles.skillName, isLocked && styles.skillNameLocked]}>
        {skill.name}
      </Text>
      {isLocked && <Lock size={14} color={COLORS.text.muted} />}
    </View>
  );
}

export default function CourseScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { courseId, topic } = useLocalSearchParams();

  if (!fontsLoaded) return null;

  // Use topic from params or fallback to sample
  const course = {
    ...SAMPLE_COURSE,
    title: topic || SAMPLE_COURSE.title,
  };

  const handleBack = () => {
    router.replace('/home');
  };

  const handleContinue = () => {
    router.push({
      pathname: '/lesson',
      params: { courseId, lessonId: 'next' },
    });
  };

  const handleViewSkillGraph = () => {
    router.push({
      pathname: '/skillgraph',
      params: { courseId },
    });
  };

  const handleReview = () => {
    router.push({
      pathname: '/lesson',
      params: { courseId, mode: 'review' },
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{course.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressPercent}>{course.progress}%</Text>
            </View>
            <BrokMascot size={80} mood="encouraging" />
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${course.progress}%` }]} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Flame size={20} color="#FF6B35" />
            <Text style={styles.statValue}>{course.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={20} color="#10B981" />
            <Text style={styles.statValue}>{course.dailyGoal}</Text>
            <Text style={styles.statLabel}>Daily Goal</Text>
          </View>
        </View>

        {/* Next Up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Up</Text>
          <TouchableOpacity style={styles.nextLessonCard} onPress={handleContinue}>
            <View style={styles.nextLessonIcon}>
              <BookOpen size={24} color={COLORS.primary} />
            </View>
            <View style={styles.nextLessonContent}>
              <Text style={styles.nextLessonTitle}>{course.nextLesson.title}</Text>
              <Text style={styles.nextLessonMeta}>
                {course.nextLesson.type} • {course.nextLesson.time}
              </Text>
            </View>
            <View style={styles.playButton}>
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Skills Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <TouchableOpacity onPress={handleViewSkillGraph} style={styles.viewAllButton}>
              <Map size={16} color={COLORS.primary} />
              <Text style={styles.viewAllText}>View Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsContainer}>
            {course.skills.map((skill) => (
              <SkillPill key={skill.id} skill={skill} />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionCard} onPress={handleViewSkillGraph}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Map size={20} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Skill Graph</Text>
              <Text style={styles.actionSubtitle}>See your progress map</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleReview}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <RotateCcw size={20} color="#B45309" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Review Past Lessons</Text>
              <Text style={styles.actionSubtitle}>Strengthen your memory</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.continueGradient}
          >
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.continueText}>Continue Learning</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  progressPercent: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
    color: COLORS.text.primary,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: COLORS.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.primary,
  },
  nextLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nextLessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  nextLessonContent: {
    flex: 1,
  },
  nextLessonTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  nextLessonMeta: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
    gap: 6,
  },
  skillPillLocked: {
    backgroundColor: '#F5F5F5',
  },
  skillMastery: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: `${COLORS.primary}20`,
  },
  skillMasteryComplete: {
    backgroundColor: '#DCFCE7',
  },
  skillName: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.primary,
    zIndex: 1,
  },
  skillNameLocked: {
    color: COLORS.text.muted,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: COLORS.text.primary,
  },
  actionSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    gap: 10,
  },
  continueText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
