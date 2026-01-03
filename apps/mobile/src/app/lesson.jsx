import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ChevronRight, Star, AlertTriangle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import { api } from '@/lib/api';
import UnitRouter from '@/components/units/UnitRouter';
import BrokMascot from '@/components/mascot/BrokMascot';

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { courseId, threadId, skillId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [unitsCompleted, setUnitsCompleted] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Use threadId or courseId (for backwards compatibility)
  const activeThreadId = threadId || courseId;

  // Fetch next unit from API
  const {
    data: unitData,
    isLoading: unitLoading,
    error: unitError,
    refetch: refetchUnit,
  } = useQuery({
    queryKey: ['nextUnit', activeThreadId],
    queryFn: async () => {
      const data = await api.threads.getNext(activeThreadId);
      return data;
    },
    enabled: !!activeThreadId,
    staleTime: 0, // Always fetch fresh unit
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async ({ unitId, response, timeSpent, hintCount }) => {
      return api.units.submit(unitId, response, timeSpent, hintCount);
    },
    onSuccess: (result) => {
      // Invalidate stats to update XP
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  if (!fontsLoaded) return null;

  const unit = unitData?.unit;
  const skillName = unitData?.skillName || unit?.skill_name || 'Learning';
  const threadProgress = unitData?.threadProgress || 0;

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = async (response, timeSpent = 0, hintCount = 0) => {
    if (!unit?.id) return null;

    try {
      const result = await submitMutation.mutateAsync({
        unitId: unit.id,
        response,
        timeSpent,
        hintCount,
      });

      setLastResult(result);
      setShowResult(true);

      // Track XP earned from evidence
      if (result?.masteryUpdate?.delta?.p > 0) {
        setXpEarned((prev) => prev + 10);
      }

      return result;
    } catch (error) {
      console.error('Submit error:', error);
      return { error: error.message };
    }
  };

  const handleContinue = async () => {
    setUnitsCompleted((prev) => prev + 1);

    // Check if skill was mastered
    if (lastResult?.nextAction === 'skill_mastered') {
      router.replace({
        pathname: '/complete',
        params: {
          courseId: activeThreadId,
          skillId: unit?.node_id,
          xp: xpEarned,
          skillName,
        },
      });
      return;
    }

    // Animate transition and fetch next unit
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(async () => {
      setShowResult(false);
      setLastResult(null);
      await refetchUnit();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Loading state
  if (unitLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#E0F4FF', '#D5E5FF', '#E8D5FF', '#FFE5EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Preparing your lesson...</Text>
        <BrokMascot size={100} mood="thinking" />
      </View>
    );
  }

  // Error state
  if (unitError) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#E0F4FF', '#D5E5FF', '#E8D5FF', '#FFE5EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AlertTriangle size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{unitError.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchUnit()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No more units (thread complete)
  if (unitData?.complete || !unit) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#E0F4FF', '#D5E5FF', '#E8D5FF', '#FFE5EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BrokMascot size={140} mood="celebrating" />
        <Text style={styles.completeTitle}>All Done!</Text>
        <Text style={styles.completeText}>
          You've completed all available lessons for now.
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={handleClose}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Back to Course</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const isCorrect = lastResult?.gradedResult?.correct;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#E0F4FF', '#D5E5FF', '#E8D5FF', '#FFE5EC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.skillName} numberOfLines={1}>{skillName}</Text>
        </View>

        <View style={styles.xpBadge}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.xpText}>{xpEarned}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${threadProgress}%` }]} />
        </View>
      </View>

      {/* Unit Content */}
      <Animated.View style={[styles.unitContainer, { opacity: fadeAnim }]}>
        <UnitRouter
          unit={unit}
          onSubmit={handleSubmit}
          loading={submitMutation.isPending}
        />
      </Animated.View>

      {/* Continue button (shown after answering) */}
      {showResult && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={isCorrect ? ['#22C55E', '#16A34A'] : [COLORS.primary, COLORS.primaryDark]}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {lastResult?.nextAction === 'skill_mastered' ? 'Skill Complete!' : 'Continue'}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Mastery progress indicator */}
          {lastResult?.masteryProgress && (
            <View style={styles.masteryInfo}>
              <Text style={styles.masteryText}>
                Mastery: {Math.round(lastResult.masteryProgress.masteryPercent || 0)}%
              </Text>
              {lastResult.masteryProgress.isMastered && (
                <View style={styles.masteredBadge}>
                  <Text style={styles.masteredText}>MASTERED</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F4FF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  skillName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  xpText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#B45309',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  unitContainer: {
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    marginBottom: 12,
  },
  retryText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  completeTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: COLORS.text.primary,
    marginTop: 20,
  },
  completeText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#22C55E',
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
  masteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  masteryText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  masteredBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteredText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#166534',
  },
});
