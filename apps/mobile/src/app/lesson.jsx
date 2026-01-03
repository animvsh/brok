import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, ChevronRight, Star } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Constants
const XP_PER_CORRECT_ANSWER = 15;
const FILL_BLANK_SIMILARITY_THRESHOLD = 0.85;
const REVIEW_INTERVAL_HOURS = 24;

// Feedback messages
const CORRECT_MESSAGES = ['You got it!', 'Perfect!', 'Nice one!', 'Exactly!', 'Great job!'];
const WRONG_MESSAGES = ['Not quite...', 'Try again!', 'Almost!', 'Keep going!'];

// Fuzzy matching for fill-in-the-blank answers
function fuzzyMatch(userAnswer, correctAnswer) {
  const user = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();
  
  // Exact match
  if (user === correct) return true;
  
  // Remove common punctuation and articles
  const normalize = (str) => str
    .replace(/[.,!?;:]/g, '')
    .replace(/\b(the|a|an)\b/gi, '')
    .trim();
  
  const userNorm = normalize(user);
  const correctNorm = normalize(correct);
  
  // Normalized exact match
  if (userNorm === correctNorm) return true;
  
  // Check if user answer contains the correct answer (for longer answers)
  if (userNorm.includes(correctNorm) || correctNorm.includes(userNorm)) {
    // Only accept if the match is substantial (at least 3 characters)
    if (correctNorm.length >= 3) return true;
  }
  
  // Calculate similarity (simple Levenshtein-like check)
  const similarity = calculateSimilarity(userNorm, correctNorm);
  return similarity >= FILL_BLANK_SIMILARITY_THRESHOLD;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Convert question data to lesson step format
function convertQuestionToStep(question, conceptName, questionIndex) {
  if (!question || !question.question) {
    console.warn('Invalid question data:', question);
    return null;
  }

  if (question.type === 'multiple_choice') {
    // Ensure options exist and is an array
    const options = Array.isArray(question.options) && question.options.length > 0
      ? question.options
      : [];
    
    if (options.length === 0) {
      console.warn('Multiple choice question has no options:', question);
      return null; // Skip questions without options
    }

    // Find correct answer index
    const correctIndex = options.findIndex((opt) => 
      String(opt).trim().toLowerCase() === String(question.correctAnswer || '').trim().toLowerCase()
    );

    if (correctIndex === -1) {
      console.warn('Could not find correct answer in options:', {
        correctAnswer: question.correctAnswer,
        options,
      });
      // Use first option as fallback
      return {
        id: questionIndex,
        type: 'mcq',
        conceptName,
        questionId: questionIndex,
        content: {
          question: question.question,
          options,
          correct: 0,
          explanation: question.explanation || '',
        },
      };
    }

    return {
      id: questionIndex,
      type: 'mcq',
      conceptName,
      questionId: questionIndex,
      content: {
        question: question.question,
        options,
        correct: correctIndex,
        explanation: question.explanation || '',
      },
    };
  } else if (question.type === 'true_false') {
    const options = ['True', 'False'];
    const correctAnswer = String(question.correctAnswer || 'True').trim();
    return {
      id: questionIndex,
      type: 'mcq',
      conceptName,
      questionId: questionIndex,
      content: {
        question: question.question,
        options,
        correct: correctAnswer.toLowerCase() === 'true' ? 0 : 1,
        explanation: question.explanation || '',
      },
    };
  } else if (question.type === 'fill_blank') {
    // For fill_blank, store the correct answer for text input matching
    return {
      id: questionIndex,
      type: 'fill_blank',
      conceptName,
      questionId: questionIndex,
      content: {
        question: question.question,
        correctAnswer: String(question.correctAnswer || '').trim(),
        explanation: question.explanation || '',
      },
    };
  }
  
  console.warn('Unknown question type:', question.type, question);
  return null;
}

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user } = useAuth();
  const { courseId, moduleId, moduleTitle } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;

  // Fetch concepts for this module
  const { data: concepts, isLoading: conceptsLoading } = useQuery({
    queryKey: ['moduleConcepts', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
  });

  // Convert concepts to lesson steps
  const lessonSteps = React.useMemo(() => {
    if (!concepts || concepts.length === 0) return [];
    const steps = [];
    let questionIndex = 0;

    concepts.forEach((concept) => {
      const questions = typeof concept.concept_data === 'string'
        ? JSON.parse(concept.concept_data)
        : concept.concept_data;

      if (Array.isArray(questions)) {
        questions.forEach((question) => {
          // Validate question has required fields
          if (!question || !question.question) {
            console.warn('Skipping invalid question:', question);
            return;
          }

          const step = convertQuestionToStep(question, concept.concept_name, questionIndex);
          if (step && step.content) {
            // For fill_blank questions, check for correctAnswer instead of options
            if (step.type === 'fill_blank') {
              if (step.content.correctAnswer) {
                step.conceptId = concept.id;
                steps.push(step);
                questionIndex++;
              } else {
                console.warn('Skipping fill_blank question without correctAnswer:', question);
              }
            } else if (Array.isArray(step.content.options) && step.content.options.length > 0) {
              // For multiple choice questions, check for options
              step.conceptId = concept.id;
              steps.push(step);
              questionIndex++;
            } else {
              console.warn('Skipping question without valid options:', question);
            }
          }
        });
      }
    });

    // Limit to 10 questions per lesson for better UX
    return steps.slice(0, 10);
  }, [concepts]);

  // Create learning session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !moduleId) return null;
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Update session on completion
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, correct, total }) => {
      if (!sessionId) return;
      const { error } = await supabase
        .from('learning_sessions')
        .update({
          completed_at: new Date().toISOString(),
          questions_answered: total,
          questions_correct: correct,
          xp_earned: correct * XP_PER_CORRECT_ANSWER,
        })
        .eq('id', sessionId);
      if (error) throw error;
    },
  });

  // Update user performance
  const updatePerformanceMutation = useMutation({
    mutationFn: async ({ conceptId, isCorrect: correct }) => {
      if (!user?.id || !conceptId) return;
      
      // Get or create performance record
      const { data: existing } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', user.id)
        .eq('concept_id', conceptId)
        .single();

      if (existing) {
        // Update existing
        const newTimesSeen = (existing.times_seen || 0) + 1;
        const newTimesCorrect = correct ? (existing.times_correct || 0) + 1 : (existing.times_correct || 0);
        const newMastery = Math.min(1.0, newTimesCorrect / Math.max(1, newTimesSeen));
        
        await supabase
          .from('user_performance')
          .update({
            times_seen: newTimesSeen,
            times_correct: newTimesCorrect,
            mastery_level: newMastery,
            last_seen: new Date().toISOString(),
            next_review: new Date(Date.now() + REVIEW_INTERVAL_HOURS * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('user_performance')
          .insert({
            user_id: user.id,
            concept_id: conceptId,
            times_seen: 1,
            times_correct: correct ? 1 : 0,
            mastery_level: correct ? 0.5 : 0.0,
            last_seen: new Date().toISOString(),
            next_review: new Date(Date.now() + REVIEW_INTERVAL_HOURS * 60 * 60 * 1000).toISOString(),
          });
      }
    },
  });

  // Initialize session on mount
  useEffect(() => {
    if (user?.id && moduleId && !sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data) setSessionId(data.id);
        },
      });
    }
  }, [user?.id, moduleId]);

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

  if (conceptsLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (!lessonSteps || lessonSteps.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No questions available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const step = lessonSteps[currentStep];
  const progress = (currentStep + 1) / lessonSteps.length;
  const isLast = currentStep === lessonSteps.length - 1;

  const handleClose = () => {
    router.back();
  };

  const handleAnswer = (index) => {
    if (showResult) return;

    let correct = false;
    let answerValue = '';

    if (step.type === 'fill_blank') {
      // Handle fill-in-the-blank with fuzzy matching
      const userAnswer = textAnswer.trim();
      if (!userAnswer) return; // Don't submit empty answers
      const correctAnswer = step.content.correctAnswer || '';
      correct = fuzzyMatch(userAnswer, correctAnswer);
      answerValue = userAnswer;
      setSelected(-1); // Special value for fill_blank
    } else {
      // Handle multiple choice
      if (index === undefined || index === null) return;
      setSelected(index);
      correct = index === step.content.correct;
      answerValue = index;
    }

    setIsCorrect(correct);

    // Track answer
    const answer = {
      stepId: step.id,
      conceptId: step.conceptId,
      selected: answerValue,
      correct,
    };
    setAnswers([...answers, answer]);

    // Update performance
    if (step.conceptId) {
      updatePerformanceMutation.mutate({
        conceptId: step.conceptId,
        isCorrect: correct,
      });
    }

    setTimeout(() => {
      setShowResult(true);

      if (correct) {
        setXpEarned((prev) => prev + XP_PER_CORRECT_ANSWER);
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

  const handleContinue = async () => {
    if (currentStep < lessonSteps.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentStep(currentStep + 1);
        setSelected(null);
        setTextAnswer('');
        setShowResult(false);
        setIsCorrect(false);
        mascotAnim.setValue(0);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Lesson complete
      const correctCount = answers.filter((a) => a.correct).length;
      
      // Update session
      if (sessionId) {
        updateSessionMutation.mutate({
          sessionId,
          correct: correctCount,
          total: answers.length,
        });
      }

      // Update user progress (XP, streak, etc.)
      if (user?.id) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progress) {
          await supabase
            .from('user_progress')
            .update({
              total_xp: (progress.total_xp || 0) + xpEarned,
              last_active_date: new Date().toISOString().split('T')[0],
            })
            .eq('id', progress.id);
        }

        // Mark module as completed after finishing the lesson
        if (moduleId && answers.length > 0) {
          // Mark module as completed
          await supabase
            .from('module_completions')
            .upsert({
              user_id: user.id,
              module_id: moduleId,
              mastery_achieved: correctCount / answers.length,
              xp_earned: xpEarned,
            }, { onConflict: 'user_id,module_id' });

          // Move to next module automatically
          const { data: modules } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('module_order', { ascending: true });

          const currentModuleIndex = modules?.findIndex((m) => m.id === moduleId);
          const nextModule = modules?.[currentModuleIndex + 1];

          if (nextModule) {
            // Update user progress to point to next module
            await supabase
              .from('user_progress')
              .update({ current_module_id: nextModule.id })
              .eq('user_id', user.id);
          } else {
            // Course complete - clear current module
            await supabase
              .from('user_progress')
              .update({ current_module_id: null })
              .eq('user_id', user.id);
          }
        }
      }

      // Invalidate queries to refresh course page
      queryClient.invalidateQueries({ queryKey: ['courseModules'] });
      queryClient.invalidateQueries({ queryKey: ['moduleCompletions'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });

      router.replace({
        pathname: '/complete',
        params: {
          courseId,
          moduleId,
          xp: xpEarned,
          correct: correctCount,
          total: answers.length,
        },
      });
    }
  };

  const feedbackMessage = isCorrect
    ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
    : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="light-content" />


      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
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

          {/* Multiple Choice Options */}
          {step.type === 'mcq' && step.content.options && step.content.options.length > 0 ? (
            <View style={styles.optionsContainer}>
              {step.content.options.map((option, index) => {
                const isSelected = selected === index;
                const isCorrectOption = index === step.content.correct;

                let backgroundColor = '#1A1A1A';
                let borderColor = '#333333';
                let textColor = '#FFFFFF';

                if (showResult) {
                  if (isCorrectOption) {
                    backgroundColor = '#1A3A2A';
                    borderColor = '#22C55E';
                    textColor = '#86EFAC';
                  } else if (isSelected && !isCorrect) {
                    backgroundColor = '#3A1A1A';
                    borderColor = '#EF4444';
                    textColor = '#FCA5A5';
                  } else {
                    // Unselected options when showing result
                    backgroundColor = '#1A1A1A';
                    borderColor = '#333333';
                    textColor = '#B0B0B0';
                  }
                } else if (isSelected) {
                  backgroundColor = '#2A2A3A';
                  borderColor = COLORS.primary;
                  textColor = '#FFFFFF';
                } else {
                  // Default unselected state
                  backgroundColor = '#1A1A1A';
                  borderColor = '#333333';
                  textColor = '#FFFFFF';
                }

                return (
                  <Animated.View
                    key={index}
                    style={{
                      transform: [
                        { translateX: isSelected && !isCorrect && showResult ? shakeAnim : 0 },
                        {
                          scale:
                            isCorrect && isCorrectOption && showResult
                              ? bounceAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.05],
                                })
                              : 1,
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor,
                          borderColor,
                          borderWidth: borderColor !== 'transparent' ? 2 : 0,
                        },
                      ]}
                      onPress={() => handleAnswer(index)}
                      disabled={showResult}
                      activeOpacity={0.8}
                    >
                      {showResult && isCorrectOption && (
                        <View style={styles.checkIcon}>
                          <Check size={16} color="#22C55E" strokeWidth={3} />
                        </View>
                      )}
                      <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          ) : step.type === 'fill_blank' ? (
            /* Fill in the Blank Input */
            <View style={styles.fillBlankContainer}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: showResult && !isCorrect ? shakeAnim : 0,
                    },
                    {
                      scale:
                        showResult && isCorrect
                          ? bounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.02],
                            })
                          : 1,
                    },
                  ],
                }}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    showResult && isCorrect && styles.textInputCorrect,
                    showResult && !isCorrect && styles.textInputWrong,
                  ]}
                  value={textAnswer}
                  onChangeText={setTextAnswer}
                  placeholder="Type your answer here..."
                  placeholderTextColor={COLORS.text.muted}
                  editable={!showResult}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {showResult && isCorrect && (
                  <View style={styles.checkIconAbsolute}>
                    <Check size={20} color="#22C55E" strokeWidth={3} />
                  </View>
                )}
              </Animated.View>
              {!showResult && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !textAnswer.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={() => handleAnswer()}
                  disabled={!textAnswer.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              )}
              {showResult && (
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>Correct answer:</Text>
                  <Text style={styles.correctAnswerText}>{step.content.correctAnswer}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                ⚠️ This question has no options available. Please contact support.
              </Text>
            </View>
          )}

          {/* Explanation */}
          {showResult && step.content.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationText}>{step.content.explanation}</Text>
            </View>
          )}

          {/* Helper text */}
          <Text style={styles.helperText}>No stress — this just helps me help you 🐸</Text>
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
          <View
            style={[
              styles.feedbackContainer,
              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <Text style={[styles.feedbackText, { color: isCorrect ? '#166534' : '#991B1B' }]}>
              {feedbackMessage}
            </Text>
            {isCorrect && (
              <View style={styles.xpBadge}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.xpText}>+{XP_PER_CORRECT_ANSWER} XP</Text>
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
                {isLast ? 'Finish' : 'Continue'}
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
  backButton: {
    padding: 12,
  },
  backButtonText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.primary,
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
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: 34,
  },
  optionsContainer: {
    gap: 12,
  },
  errorContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  errorText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  fillBlankContainer: {
    gap: 16,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#333333',
  },
  textInputCorrect: {
    backgroundColor: '#1A3A2A',
    borderColor: '#22C55E',
  },
  textInputWrong: {
    backgroundColor: '#3A1A1A',
    borderColor: '#EF4444',
  },
  checkIconAbsolute: {
    position: 'absolute',
    right: 18,
    top: 18,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  correctAnswerContainer: {
    backgroundColor: '#1A2A3A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  correctAnswerLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  correctAnswerText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  checkIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  explanationContainer: {
    backgroundColor: '#1A2A3A',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  explanationText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
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
    backgroundColor: '#1A3A2A',
  },
  feedbackWrong: {
    backgroundColor: '#3A1A1A',
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
