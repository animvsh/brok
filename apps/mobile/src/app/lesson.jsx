import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, ChevronRight, Lightbulb } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';

// Sample lesson content (in real app, fetched from API)
const SAMPLE_LESSON = {
  title: 'Arrays Basics',
  steps: [
    {
      id: 1,
      type: 'explain',
      content: {
        title: 'What is an Array?',
        text: 'An array is a collection of items stored at contiguous memory locations. Think of it like a row of boxes, each with a number (index) starting from 0.',
        highlight: 'Arrays let you store multiple values in a single variable.',
      },
    },
    {
      id: 2,
      type: 'mcq',
      content: {
        question: 'What index does the first element of an array have?',
        options: ['0', '1', '-1', 'None'],
        correct: 0,
      },
    },
    {
      id: 3,
      type: 'explain',
      content: {
        title: 'Array Access',
        text: 'You can access any element instantly using its index. This is called O(1) or "constant time" access.',
        highlight: 'arr[0] gives you the first element.',
      },
    },
    {
      id: 4,
      type: 'truefalse',
      content: {
        statement: 'Arrays can only store numbers.',
        correct: false,
        explanation: 'Arrays can store any type of data: numbers, strings, objects, even other arrays!',
      },
    },
    {
      id: 5,
      type: 'mcq',
      content: {
        question: 'What is the time complexity of accessing an element by index?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        correct: 0,
      },
    },
  ],
};

// Feedback messages
const CORRECT_MESSAGES = ['nice', 'clean', 'exactly', 'perfect'];
const WRONG_MESSAGES = ['not quite', 'try again', 'almost'];

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { threadId, nodeId } = useLocalSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) return null;

  const lesson = SAMPLE_LESSON;
  const step = lesson.steps[currentStep];
  const progress = (currentStep + 1) / lesson.steps.length;

  const handleClose = () => {
    router.back();
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    setSelected(answer);

    const correct = step.type === 'truefalse'
      ? answer === step.content.correct
      : answer === step.content.correct;

    setIsCorrect(correct);

    setTimeout(() => {
      setShowResult(true);

      if (correct) {
        // Glow animation
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }
    }, 200);
  };

  const handleContinue = () => {
    if (currentStep < lesson.steps.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentStep(currentStep + 1);
        setSelected(null);
        setShowResult(false);
        setIsCorrect(false);
        glowAnim.setValue(0);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Lesson complete
      router.replace({
        pathname: '/complete',
        params: { threadId, nodeId },
      });
    }
  };

  const renderExplain = () => (
    <View style={styles.explainContainer}>
      <Text style={styles.explainTitle}>{step.content.title}</Text>
      <Text style={styles.explainText}>{step.content.text}</Text>
      {step.content.highlight && (
        <View style={styles.highlightBox}>
          <Lightbulb size={18} color={COLORS.xp.gold} />
          <Text style={styles.highlightText}>{step.content.highlight}</Text>
        </View>
      )}
    </View>
  );

  const renderMCQ = () => (
    <View style={styles.mcqContainer}>
      <Text style={styles.questionText}>{step.content.question}</Text>
      <View style={styles.optionsContainer}>
        {step.content.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrectOption = index === step.content.correct;

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
            <Animated.View
              key={index}
              style={{ transform: [{ translateX: isSelected && !isCorrect && showResult ? shakeAnim : 0 }] }}
            >
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor, borderColor }]}
                onPress={() => handleAnswer(index)}
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
                  <Check size={20} color="#4CAF50" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

  const renderTrueFalse = () => (
    <View style={styles.tfContainer}>
      <Text style={styles.questionText}>{step.content.statement}</Text>
      <View style={styles.tfButtonsRow}>
        {[true, false].map((value) => {
          const isSelected = selected === value;
          const isCorrectOption = value === step.content.correct;

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
              key={String(value)}
              style={[styles.tfButton, { backgroundColor, borderColor }]}
              onPress={() => handleAnswer(value)}
              disabled={showResult}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tfButtonText,
                showResult && isCorrectOption && { color: '#2E7D32' },
                showResult && isSelected && !isCorrect && { color: '#C62828' },
              ]}>
                {value ? 'True' : 'False'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {showResult && step.content.explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{step.content.explanation}</Text>
        </View>
      )}
    </View>
  );

  const renderFeedback = () => {
    if (!showResult || step.type === 'explain') return null;

    const message = isCorrect
      ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
      : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];

    return (
      <Animated.View style={[
        styles.feedbackContainer,
        isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
        { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
      ]}>
        <Text style={[
          styles.feedbackText,
          { color: isCorrect ? '#2E7D32' : '#C62828' },
        ]}>
          {message}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {step.type === 'explain' && renderExplain()}
          {step.type === 'mcq' && renderMCQ()}
          {step.type === 'truefalse' && renderTrueFalse()}
        </Animated.View>

        {renderFeedback()}
      </ScrollView>

      {/* Continue button */}
      {(step.type === 'explain' || showResult) && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={isCorrect || step.type === 'explain' ? [COLORS.primary, COLORS.primaryDark] : ['#9E9E9E', '#757575']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {currentStep < lesson.steps.length - 1 ? 'Continue' : 'Finish'}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  // Explain styles
  explainContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  explainTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  explainText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 17,
    color: COLORS.text.secondary,
    lineHeight: 26,
    marginBottom: 20,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.xp.gold}15`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  highlightText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
  },

  // MCQ styles
  mcqContainer: {},
  questionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginBottom: 24,
    lineHeight: 32,
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
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.primary,
  },

  // True/False styles
  tfContainer: {},
  tfButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tfButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  tfButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: COLORS.text.primary,
  },
  explanationBox: {
    marginTop: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  explanationText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },

  // Feedback
  feedbackContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackCorrect: {
    backgroundColor: '#E8F5E9',
  },
  feedbackWrong: {
    backgroundColor: '#FFEBEE',
  },
  feedbackText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
  },

  // Bottom
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
});
