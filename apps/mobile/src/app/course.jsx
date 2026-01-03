import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Play,
  Flame,
  Target,
  ChevronRight,
  BookOpen,
  Lock,
  CheckCircle,
  Circle,
  Star,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const { width } = Dimensions.get('window');

// Module status types
const MODULE_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

function ModuleNode({ module, index, totalModules, status, onPress, isLast }) {
  const isLocked = status === MODULE_STATUS.LOCKED;
  const isCompleted = status === MODULE_STATUS.COMPLETED;
  const isInProgress = status === MODULE_STATUS.IN_PROGRESS;

  // Calculate position for path layout
  const isEven = index % 2 === 0;
  const nodeWidth = (width - 80) / 2;
  const left = isEven ? 20 : nodeWidth + 40;

  return (
    <View style={styles.modulePathContainer}>
      {/* Connection line */}
      {!isLast && (
        <View
          style={[
            styles.pathLine,
            {
              left: isEven ? nodeWidth + 20 : 20,
              top: 60,
              height: 100,
            },
          ]}
        />
      )}

      {/* Module Node */}
      <TouchableOpacity
        style={[
          styles.moduleNode,
          {
            left,
            opacity: isLocked ? 0.5 : 1,
          },
        ]}
        onPress={isLocked ? null : onPress}
        disabled={isLocked}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isCompleted
              ? ['#22C55E', '#16A34A']
              : isInProgress
              ? [COLORS.primary, COLORS.primaryDark]
              : isLocked
              ? ['#E5E7EB', '#D1D5DB']
              : ['#EEF2FF', '#E0E7FF']
          }
          style={styles.moduleGradient}
        >
          {isLocked ? (
            <Lock size={24} color="#9CA3AF" />
          ) : isCompleted ? (
            <CheckCircle size={24} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Circle size={24} color={isInProgress ? '#FFFFFF' : COLORS.primary} fill="transparent" strokeWidth={3} />
          )}
        </LinearGradient>

        <View style={styles.moduleInfo}>
          <Text
            style={[
              styles.moduleNumber,
              { color: isLocked ? '#666666' : isCompleted ? '#22C55E' : '#FFFFFF' },
            ]}
          >
            {index + 1}
          </Text>
          <Text
            style={[
              styles.moduleTitle,
              { color: isLocked ? '#666666' : '#FFFFFF' },
            ]}
            numberOfLines={2}
          >
            {module.title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function CourseScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user } = useAuth();
  const { courseId, topic } = useLocalSearchParams();

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId || courseId === 'new') return null;
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && courseId !== 'new',
  });

  // Fetch modules for this course
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: async () => {
      if (!courseId || courseId === 'new') return [];
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId && courseId !== 'new',
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch module completions for this course only
  const { data: moduleCompletions } = useQuery({
    queryKey: ['moduleCompletions', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id || !courseId || courseId === 'new') return [];
      
      // First get all module IDs for this course
      const { data: courseModules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (!courseModules || courseModules.length === 0) return [];
      
      const moduleIds = courseModules.map((m) => m.id);
      
      // Then get completions only for these modules
      const { data, error } = await supabase
        .from('module_completions')
        .select('module_id')
        .eq('user_id', user.id)
        .in('module_id', moduleIds);
      
      if (error) throw error;
      return data?.map((c) => c.module_id) || [];
    },
    enabled: !!user?.id && !!courseId && courseId !== 'new',
  });

  // Calculate module statuses
  const getModuleStatus = (module, index) => {
    const completedModules = moduleCompletions || [];
    const isCompleted = completedModules.includes(module.id);
    const currentModuleId = userProgress?.current_module_id;
    const isCurrent = currentModuleId === module.id;

    if (isCompleted) return MODULE_STATUS.COMPLETED;
    if (isCurrent) return MODULE_STATUS.IN_PROGRESS;
    if (index === 0) return MODULE_STATUS.AVAILABLE;
    // Check if previous module is completed
    const prevModule = modules?.[index - 1];
    if (prevModule && completedModules.includes(prevModule.id)) {
      return MODULE_STATUS.AVAILABLE;
    }
    return MODULE_STATUS.LOCKED;
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (!modules || modules.length === 0) return 0;
    const completedCount = (moduleCompletions || []).length;
    const progress = Math.round((completedCount / modules.length) * 100);
    // Cap progress at 100% to prevent showing >100%
    return Math.min(progress, 100);
  };

  if (!fontsLoaded) return null;

  const isLoading = courseLoading || modulesLoading;
  const progress = calculateProgress();
  const streak = userProgress?.current_streak || 0;
  const xp = userProgress?.total_xp || 0;

  const courseTitle = course?.title || topic || 'Course';
  const courseDescription = course?.description || '';
  const courseGoal = course?.goal || '';

  const handleBack = () => {
    router.replace('/home');
  };

  const handleModulePress = (module) => {
    router.push({
      pathname: '/lesson',
      params: {
        courseId,
        moduleId: module.id,
        moduleTitle: module.title,
      },
    });
  };

  const handleContinue = () => {
    // Find the current or first available module
    const currentModuleId = userProgress?.current_module_id;
    let moduleToStart = null;

    if (currentModuleId) {
      moduleToStart = modules?.find((m) => m.id === currentModuleId);
    }

    if (!moduleToStart) {
      // Find first available module
      moduleToStart = modules?.find((m, idx) => getModuleStatus(m, idx) !== MODULE_STATUS.LOCKED);
    }

    if (moduleToStart) {
      handleModulePress(moduleToStart);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  if (!course && courseId !== 'new') {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseTitle}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <BrokMascot size={80} mood="encouraging" />
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          {courseDescription ? (
            <Text style={styles.courseDescription}>{courseDescription}</Text>
          ) : null}
          {courseGoal ? (
            <View style={styles.goalContainer}>
              <Target size={16} color={COLORS.primary} />
              <Text style={styles.goalText}>{courseGoal}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Flame size={20} color="#FF6B35" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <BookOpen size={20} color="#10B981" />
            <Text style={styles.statValue}>{moduleCompletions?.length || 0}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
        </View>

        {/* Learning Path */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Path</Text>
          <Text style={styles.sectionSubtitle}>
            Complete modules in order to unlock new content
          </Text>

          {modules && modules.length > 0 ? (
            <View style={styles.pathContainer}>
              {modules.map((module, index) => {
                const status = getModuleStatus(module, index);
                return (
                  <ModuleNode
                    key={module.id}
                    module={module}
                    index={index}
                    totalModules={modules.length}
                    status={status}
                    onPress={() => handleModulePress(module)}
                    isLast={index === modules.length - 1}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No modules available yet</Text>
            </View>
          )}
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
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.primary,
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
    flex: 1,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  progressCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  courseDescription: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 12,
    lineHeight: 20,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  goalText: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
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
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  pathContainer: {
    minHeight: 200,
    position: 'relative',
  },
  modulePathContainer: {
    position: 'relative',
    marginBottom: 100,
  },
  pathLine: {
    position: 'absolute',
    width: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  moduleNode: {
    position: 'absolute',
    width: (width - 80) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  moduleGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleInfo: {
    alignItems: 'center',
  },
  moduleNumber: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    marginBottom: 4,
  },
  moduleTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
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
