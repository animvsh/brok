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
import { X, Check, ChevronRight, Star, Bird, Leaf } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Sample lesson content
const SAMPLE_LESSON = {
  title: 'What is Photosynthesis?',
  steps: [
    {
      id: 1,
      type: 'mcq',
      content: {
        question: 'Which one is a mammal?',
        options: [
          { text: 'Eagle', icon: Bird },
          { text: 'Frog', icon: Leaf },
          { text: 'Dolphin', icon: null },
          { text: 'Bat', icon: Bird },
        ],
        correct: 2,
      },
    },
    {
      id: 2,
      type: 'mcq',
      content: {
        question: 'What is Photosynthesis?',
        options: [
          { text: 'A type of animal', icon: null },
          { text: 'How plants make energy', icon: Leaf },
          { text: 'A chemical reaction', icon: null },
          { text: 'None of the above', icon: null },
        ],
        correct: 1,
      },
    },
    {
      id: 3,
      type: 'mcq',
      content: {
        question: 'Which gas do plants absorb?',
        options: [
          { text: 'Oxygen', icon: null },
          { text: 'Nitrogen', icon: null },
          { text: 'Carbon Dioxide', icon: Leaf },
          { text: 'Hydrogen', icon: null },
        ],
        correct: 2,
      },
    },
  ],
};

// Feedback messages
const CORRECT_MESSAGES = ['You got it!', 'Perfect!', 'Nice one!', 'Exactly!'];
const WRONG_MESSAGES = ['Not quite...', 'Try again!', 'Almost!'];

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { courseId, lessonId, skillId, mode } = useLocalSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mascot entrance animation
    Animated.spring(mascotAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  if (!fontsLoaded) return null;

  const lesson = SAMPLE_LESSON;
  const step = lesson.steps[currentStep];
  const progress = (currentStep + 1) / lesson.steps.length;

  const handleClose = () => {
    router.back();
  };

  const handleAnswer = (index) => {
    if (showResult) return;
    setSelected(index);

    const correct = index === step.content.correct;
    setIsCorrect(correct);

    setTimeout(() => {
      setShowResult(true);

      if (correct) {
        setXpEarned((prev) => prev + 15);
        // Bounce animation
        Animated.sequence([
          Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
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
        mascotAnim.setValue(0);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Lesson complete
      router.replace({
        pathname: '/complete',
        params: { courseId, skillId, xp: xpEarned },
      });
    }
  };

  const feedbackMessage = isCorrect
    ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
    : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#E0F4FF', '#D5E5FF', '#E8D5FF', '#FFE5EC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cloud decorations */}
      <View style={[styles.cloud, styles.cloud1]} />
      <View style={[styles.cloud, styles.cloud2]} />

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
          {/* Question */}
          <Text style={styles.questionText}>{step.content.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {step.content.options.map((option, index) => {
              const isSelected = selected === index;
              const isCorrectOption = index === step.content.correct;
              const Icon = option.icon;

              let backgroundColor = '#FFFFFF';
              let borderColor = 'transparent';
              let textColor = COLORS.text.primary;

              if (showResult) {
                if (isCorrectOption) {
                  backgroundColor = '#DCFCE7';
                  borderColor = '#22C55E';
                  textColor = '#166534';
                } else if (isSelected && !isCorrect) {
                  backgroundColor = '#FEE2E2';
                  borderColor = '#EF4444';
                  textColor = '#991B1B';
                }
              } else if (isSelected) {
                backgroundColor = '#EEF2FF';
                borderColor = COLORS.primary;
              }

              return (
                <Animated.View
                  key={index}
                  style={{
                    transform: [
                      { translateX: isSelected && !isCorrect && showResult ? shakeAnim : 0 },
                      { scale: isCorrect && isCorrectOption && showResult
                        ? bounceAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          })
                        : 1
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      { backgroundColor, borderColor, borderWidth: borderColor !== 'transparent' ? 2 : 0 },
                    ]}
                    onPress={() => handleAnswer(index)}
                    disabled={showResult}
                    activeOpacity={0.8}
                  >
                    {Icon && (
                      <View style={styles.optionIcon}>
                        <Icon size={18} color={textColor} />
                      </View>
                    )}
                    {showResult && isCorrectOption && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color="#22C55E" strokeWidth={3} />
                      </View>
                    )}
                    <Text style={[styles.optionText, { color: textColor }]}>
                      {option.text}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            No stress — this just helps me help you 🐸
          </Text>
        </Animated.View>

        {/* Mascot */}
        <Animated.View
          style={[
            styles.mascotContainer,
            {
              transform: [
                {
                  scale: mascotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: mascotAnim,
            },
          ]}
        >
          <BrokMascot
            size={140}
            mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : 'happy'}
          />
        </Animated.View>

        {/* Feedback */}
        {showResult && (
          <View style={[
            styles.feedbackContainer,
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
          ]}>
            <Text style={[
              styles.feedbackText,
              { color: isCorrect ? '#166534' : '#991B1B' },
            ]}>
              {feedbackMessage}
            </Text>
            {isCorrect && (
              <View style={styles.xpBadge}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.xpText}>+15 XP</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      {showResult && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={isCorrect ? ['#22C55E', '#16A34A'] : [COLORS.primary, COLORS.primaryDark]}
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
    backgroundColor: '#E0F4FF',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 100,
  },
  cloud1: {
    width: 120,
    height: 50,
    top: 120,
    right: -30,
  },
  cloud2: {
    width: 80,
    height: 35,
    bottom: 200,
    left: -20,
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
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  questionText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    marginBottom: 24,
    lineHeight: 34,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    marginRight: 12,
  },
  checkIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  helperText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
  },
  feedbackCorrect: {
    backgroundColor: '#DCFCE7',
  },
  feedbackWrong: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  xpText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#B45309',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
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
});
