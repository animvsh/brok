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
import { Check, X } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Sample skill check questions (in real app, fetched from API)
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: 'What is the time complexity of accessing an element in an array?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correct: 0,
  },
  {
    id: 2,
    question: 'Which data structure uses LIFO?',
    options: ['Queue', 'Stack', 'Array', 'Tree'],
    correct: 1,
  },
  {
    id: 3,
    question: 'What is a linked list?',
    options: [
      'A list of links',
      'A linear data structure with nodes',
      'A type of array',
      'A sorting algorithm',
    ],
    correct: 1,
  },
  {
    id: 4,
    question: 'Binary search works on...',
    options: ['Any array', 'Sorted arrays only', 'Linked lists', 'Trees only'],
    correct: 1,
  },
];

export default function SkillCheckScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();
  const { threadId } = useLocalSearchParams();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) return null;

  const question = SAMPLE_QUESTIONS[currentQ];
  const isCorrect = selected === question.correct;
  const progress = (currentQ + 1) / SAMPLE_QUESTIONS.length;

  const handleSelect = (index) => {
    if (showResult) return;
    setSelected(index);

    // Show result after short delay
    setTimeout(() => {
      setShowResult(true);
      setAnswers([...answers, { questionId: question.id, selected: index, correct: question.correct }]);

      // Animate feedback
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }, 300);
  };

  const handleNext = async () => {
    if (currentQ < SAMPLE_QUESTIONS.length - 1) {
      // Animate transition
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Skill check complete
      setLoading(true);

      // In real app, submit results to API
      setTimeout(() => {
        router.replace({
          pathname: '/home',
          params: { threadId },
        });
      }, 1000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Helper text */}
      <Text style={styles.helperText}>
        no stress — this just helps me help you
      </Text>

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <Text style={styles.questionText}>{question.question}</Text>
      </Animated.View>

      {/* Options */}
      <Animated.View style={[styles.optionsContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrectOption = index === question.correct;

          let backgroundColor = '#FFFFFF';
          let borderColor = '#E8E8E8';

          if (showResult) {
            if (isCorrectOption) {
              backgroundColor = '#E8F5E9';
              borderColor = '#4CAF50';
            } else if (isSelected && !isCorrect) {
              backgroundColor = '#FFEBEE';
              borderColor = '#F44336';
            }
          } else if (isSelected) {
            borderColor = COLORS.primary;
            backgroundColor = `${COLORS.primary}08`;
          }

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                { backgroundColor, borderColor },
              ]}
              onPress={() => handleSelect(index)}
              disabled={showResult}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.optionText,
                showResult && isCorrectOption && { color: '#2E7D32' },
                showResult && isSelected && !isCorrect && { color: '#C62828' },
              ]}>
                {option}
              </Text>

              {showResult && isCorrectOption && (
                <View style={styles.iconCorrect}>
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
              {showResult && isSelected && !isCorrect && (
                <View style={styles.iconWrong}>
                  <X size={16} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Continue button */}
      {showResult && (
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
                <Text style={styles.continueText}>
                  {currentQ < SAMPLE_QUESTIONS.length - 1 ? 'Continue' : 'Start Learning'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Building your path...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginHorizontal: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  helperText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  questionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  questionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 22,
    color: COLORS.text.primary,
    lineHeight: 32,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  iconCorrect: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrong: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  continueGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
});
