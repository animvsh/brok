import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Map, Info, X, Zap, Target, Star } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';

// Unit Components
import {
  DiagnosticMCQ,
  MicroTeachThenCheck,
  DrillSet,
  AppliedFreeResponse,
  ErrorReversal,
} from '@/components/units';

// UI Components
import GradientBackground from '@/components/ui/GradientBackground';
import BrokMascot from '@/components/mascot/BrokMascot';
import { XPBadge } from '@/components/ui/XPBadge';
import { COLORS, GRADIENTS } from '@/components/theme/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Mastery Progress Ring Component
function MasteryRing({ percentage, size = 60, strokeWidth = 6, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.ringBackground, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.ringProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderLeftColor: 'transparent',
              borderBottomColor: percentage > 50 ? color : 'transparent',
              borderRightColor: percentage > 75 ? color : 'transparent',
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />
        <Text style={styles.ringText}>{percentage}%</Text>
      </View>
    </View>
  );
}

// Skill Header Component
function SkillHeader({ node, state }) {
  if (!state) return null;

  const masteryPercent = Math.round((state.mastery_p || 0) * 100);
  const band = state.band || 'novice';

  const bandColors = {
    novice: '#9E9E9E',
    developing: COLORS.streak.fire,
    proficient: COLORS.primary,
    mastered: COLORS.status.success,
  };

  const bandLabels = {
    novice: 'Just Starting',
    developing: 'Getting There',
    proficient: 'Almost There!',
    mastered: 'Mastered!',
  };

  const color = bandColors[band] || bandColors.novice;

  return (
    <View style={styles.skillHeader}>
      <MasteryRing percentage={masteryPercent} color={color} />
      <View style={styles.skillInfo}>
        <Text style={styles.skillName} numberOfLines={1}>
          {node?.name || 'Skill'}
        </Text>
        <View style={styles.skillBadge}>
          <View style={[styles.skillBadgeDot, { backgroundColor: color }]} />
          <Text style={[styles.skillBadgeText, { color }]}>{bandLabels[band]}</Text>
        </View>
      </View>
    </View>
  );
}

// Why This Modal Component
function WhyThisModal({ visible, onClose, node, blockers }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Why This Activity?</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <X size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalSection}>
              <View style={styles.modalIconRow}>
                <Target size={24} color={COLORS.primary} />
                <Text style={styles.modalSkillName}>{node?.name}</Text>
              </View>
              <Text style={styles.modalDescription}>
                {node?.description || 'Building your understanding of this skill through targeted practice.'}
              </Text>
            </View>

            {blockers && blockers.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>TO MASTER THIS SKILL</Text>
                {blockers.map((blocker, index) => (
                  <View key={index} style={styles.blockerItem}>
                    <Star size={14} color={COLORS.xp.gold} fill={COLORS.xp.gold} />
                    <Text style={styles.blockerText}>{blocker}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalSection}>
              <View style={styles.tipCard}>
                <BrokMascot size={50} mood="encouraging" />
                <Text style={styles.tipText}>
                  Keep practicing and you'll master this in no time!
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ActionScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { threadId } = useLocalSearchParams();

  const [showWhyThis, setShowWhyThis] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [mascotMood, setMascotMood] = useState('happy');

  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Fetch next unit
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['nextUnit', threadId],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/threads/${threadId}/next`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch next unit');
      }

      return response.json();
    },
    enabled: !!threadId && !!session?.access_token,
    staleTime: 0,
    cacheTime: 0,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async ({ unitId, response, timeSpent, hintCount }) => {
      const res = await fetch(`${API_URL}/api/units/${unitId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ response, timeSpent, hintCount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      return res.json();
    },
    onSuccess: (result) => {
      // Celebrate success
      if (result?.graded?.isCorrect) {
        setMascotMood('celebrating');
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      } else {
        setMascotMood('encouraging');
      }

      // Reset after a moment
      setTimeout(() => setMascotMood('happy'), 2000);

      queryClient.invalidateQueries(['nextUnit', threadId]);
    },
  });

  useEffect(() => {
    setStartTime(Date.now());
  }, [data?.unit?.id]);

  const handleSubmit = useCallback(
    async (response) => {
      if (!data?.unit?.id) return null;

      const timeSpent = Date.now() - startTime;
      const hintCount = response.hintsUsed || 0;

      try {
        const result = await submitMutation.mutateAsync({
          unitId: data.unit.id,
          response,
          timeSpent,
          hintCount,
        });
        return result;
      } catch (error) {
        console.error('Submit error:', error);
        setMascotMood('thinking');
        Alert.alert('Oops!', 'Something went wrong. Try again?');
        return null;
      }
    },
    [data?.unit?.id, startTime, submitMutation]
  );

  const handleBack = () => router.back();
  const handleSkillMap = () => router.push({ pathname: '/skillmap', params: { threadId } });

  // Loading state
  if (!fontsLoaded || isLoading) {
    return (
      <GradientBackground variant="softBlue">
        <View style={styles.centered}>
          <BrokMascot size={100} mood="thinking" />
          <Text style={styles.loadingText}>Preparing your activity...</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        </View>
      </GradientBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <GradientBackground variant="softPink">
        <View style={styles.centered}>
          <BrokMascot size={120} mood="thinking" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  // Completed - redirect to recap
  if (data?.completed) {
    router.replace({ pathname: '/recap', params: { threadId } });
    return null;
  }

  const { unit, node, masteryState, blockers } = data || {};

  // Render the appropriate unit component
  const renderUnit = () => {
    if (!unit) {
      return (
        <View style={styles.centered}>
          <BrokMascot size={100} mood="thinking" />
          <Text style={styles.noActivityText}>No activity available right now!</Text>
        </View>
      );
    }

    const unitProps = {
      unit,
      onSubmit: handleSubmit,
      loading: submitMutation.isLoading,
    };

    switch (unit.unit_type) {
      case 'diagnostic_mcq':
        return <DiagnosticMCQ {...unitProps} />;
      case 'micro_teach_then_check':
        return <MicroTeachThenCheck {...unitProps} />;
      case 'drill_set':
        return <DrillSet {...unitProps} />;
      case 'applied_free_response':
        return <AppliedFreeResponse {...unitProps} />;
      case 'error_reversal':
        return <ErrorReversal {...unitProps} />;
      default:
        return (
          <View style={styles.centered}>
            <Text style={styles.noActivityText}>Unknown activity type</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F0F8FF', '#E8F4FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ArrowLeft size={22} color={COLORS.text.primary} />
        </TouchableOpacity>

        {/* Mascot */}
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <BrokMascot size={50} mood={mascotMood} />
        </Animated.View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowWhyThis(true)} style={styles.headerButton}>
            <Info size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkillMap} style={styles.headerButton}>
            <Map size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Skill Header */}
      <View style={styles.skillHeaderContainer}>
        <SkillHeader node={node} state={masteryState} />
      </View>

      {/* Unit Content */}
      <View style={styles.unitContainer}>{renderUnit()}</View>

      {/* Why This Modal */}
      <WhyThisModal
        visible={showWhyThis}
        onClose={() => setShowWhyThis(false)}
        node={node}
        blockers={blockers}
      />
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
  errorTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
  },
  retryButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: 'white',
  },
  noActivityText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },

  // Skill Header
  skillHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skillBadgeText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 13,
  },

  // Ring
  ringBackground: {
    position: 'absolute',
    borderWidth: 6,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringProgress: {
    position: 'absolute',
  },
  ringText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORS.text.primary,
  },

  // Unit Container
  unitContainer: {
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: COLORS.text.primary,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalSkillName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  modalDescription: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  modalSectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORS.text.muted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  blockerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  blockerText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});
