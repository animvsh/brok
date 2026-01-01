import React, { useState, useRef } from 'react';
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
import { Check, X, ChevronRight } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Sample skill check questions
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: 'How familiar are you with this topic?',
    options: ['Complete beginner', 'Some basics', 'Intermediate', 'Advanced'],
    weights: [0, 0.3, 0.6, 0.9],
  },
  {
    id: 2,
    question: 'Have you studied this before?',
    options: ['Never', 'A little', 'Quite a bit', 'Extensively'],
    weights: [0, 0.25, 0.5, 0.85],
  },
  {
    id: 3,
    question: 'Can you explain the basics to someone?',
    options: ['Not at all', 'Maybe a little', 'Somewhat', 'Definitely'],
    weights: [0, 0.3, 0.6, 0.9],
  },
  {
    id: 4,
    question: 'How confident do you feel?',
    options: ['Not confident', 'Slightly', 'Fairly confident', 'Very confident'],
    weights: [0, 0.3, 0.6, 0.9],
  },
];

export default function SkillCheckScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();
  const { topic, intent, intensity } = useLocalSearchParams();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) return null;

  const question = SAMPLE_QUESTIONS[currentQ];
  const progress = (currentQ + 1) / SAMPLE_QUESTIONS.length;
  const isLast = currentQ === SAMPLE_QUESTIONS.length - 1;

  const handleSelect = (index) => {
    setSelected(index);
    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.03, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = async () => {
    const newAnswers = [...answers, { questionId: question.id, selected, weight: question.weights[selected] }];
    setAnswers(newAnswers);

    if (!isLast) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Create course
      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/threads/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            input: topic,
            inputType: 'text',
            intent,
            intensity,
            skillCheck: newAnswers,
          }),
        });

        const data = await response.json();

        if (response.ok && data.threadId) {
          router.replace({
            pathname: '/course',
            params: { courseId: data.threadId },
          });
        } else {
          // Fallback to course with sample ID
          router.replace({
            pathname: '/course',
            params: { courseId: 'new' },
          });
        }
      } catch (error) {
        console.error('Error:', error);
        router.replace({
          pathname: '/course',
          params: { courseId: 'new' },
        });
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#E0F4FF', '#D5E5FF', '#E8D5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Helper text */}
      <Text style={styles.helperText}>No stress — this just helps me help you</Text>

      {/* Question */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.questionText}>{question.question}</Text>

        {/* Options */}
        <Animated.View style={[styles.optionsContainer, { transform: [{ scale: scaleAnim }] }]}>
          {question.options.map((option, index) => {
            const isSelected = selected === index;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleSelect(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <BrokMascot size={120} mood={selected !== null ? 'encouraging' : 'thinking'} />
        </View>
      </Animated.View>

      {/* Continue button */}
      {selected !== null && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.continueGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.continueText}>
                    {isLast ? 'Start Learning' : 'Continue'}
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <BrokMascot size={120} mood="excited" />
          <Text style={styles.loadingTitle}>Building your path...</Text>
          <Text style={styles.loadingSubtitle}>Personalizing your learning journey</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  progressDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 3,
    marginHorizontal: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  helperText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    color: COLORS.text.primary,
    marginBottom: 28,
    lineHeight: 36,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 28,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
