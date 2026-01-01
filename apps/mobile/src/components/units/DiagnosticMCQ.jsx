import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BrokMascot from '@/components/mascot/BrokMascot';
import { QuizOption } from '@/components/ui/PillOption';
import FloatingClouds from '@/components/ui/FloatingClouds';
import { COLORS, GRADIENTS } from '@/components/theme/colors';

export default function DiagnosticMCQ({ unit, onSubmit, loading }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [mascotMood, setMascotMood] = useState('happy');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const content = unit.content || {};
  const question = content.question || 'Question not available';
  const options = content.options || [];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelect = (index) => {
    if (showResult || loading) return;
    setSelectedIndex(index);
    setMascotMood('thinking');

    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCheck = async () => {
    if (selectedIndex === null || loading) return;

    setMascotMood('thinking');
    const response = { selectedIndex };
    const submitResult = await onSubmit(response);

    setResult(submitResult);
    setShowResult(true);
    setMascotMood(submitResult?.gradedResult?.correct ? 'celebrating' : 'encouraging');
  };

  const isCorrect = result?.gradedResult?.correct;
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.container}>
      {/* Decorative clouds */}
      <FloatingClouds variant="scattered" style={styles.clouds} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* No stress message */}
        {!showResult && (
          <View style={styles.noStressContainer}>
            <Lightbulb size={16} color={COLORS.accent.purple} />
            <Text style={styles.noStressText}>
              No stress - this just helps me help you!
            </Text>
          </View>
        )}

        {/* Question Card */}
        <Animated.View
          style={[
            styles.questionCard,
            { opacity: fadeAnim, transform: [{ scale: bounceAnim }] },
          ]}
        >
          <Text style={styles.questionText}>{question}</Text>
        </Animated.View>

        {/* Options with animal icons */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectAnswer = showResult && result?.gradedResult?.correct && isSelected;
            const isWrongAnswer = showResult && !result?.gradedResult?.correct && isSelected;
            const showCorrectHighlight = showResult && content.correctIndex === index;

            let correctStatus = null;
            if (showResult) {
              if (showCorrectHighlight) correctStatus = true;
              else if (isWrongAnswer) correctStatus = false;
            }

            return (
              <QuizOption
                key={index}
                label={option}
                optionLetter={optionLetters[index]}
                selected={isSelected && !showResult}
                correct={correctStatus}
                onPress={() => handleSelect(index)}
              />
            );
          })}
        </View>

        {/* Explanation (shown after answer) */}
        {showResult && (
          <Animated.View
            style={[
              styles.explanationCard,
              isCorrect ? styles.explanationCorrect : styles.explanationWrong,
            ]}
          >
            <View style={styles.explanationHeader}>
              {isCorrect ? (
                <CheckCircle size={24} color="#4CAF50" />
              ) : (
                <XCircle size={24} color="#F44336" />
              )}
              <Text
                style={[
                  styles.explanationTitle,
                  { color: isCorrect ? '#2E7D32' : '#C62828' },
                ]}
              >
                {isCorrect ? 'Awesome!' : 'Not quite, but no worries!'}
              </Text>
            </View>
            <Text
              style={[
                styles.explanationText,
                { color: isCorrect ? '#2E7D32' : '#C62828' },
              ]}
            >
              {result?.gradedResult?.feedback || content.explanation}
            </Text>
          </Animated.View>
        )}

        {/* Check Button */}
        {!showResult && (
          <TouchableOpacity
            onPress={handleCheck}
            disabled={selectedIndex === null || loading}
            style={styles.checkButtonContainer}
          >
            <LinearGradient
              colors={
                selectedIndex !== null && !loading
                  ? [COLORS.primary, COLORS.primaryDark]
                  : ['#CCCCCC', '#AAAAAA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.checkButtonText}>Check Answer</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Mascot at bottom */}
        <View style={styles.mascotContainer}>
          <BrokMascot size={80} mood={mascotMood} />
          {showResult && (
            <Text style={styles.mascotMessage}>
              {isCorrect
                ? "You're doing great!"
                : "Keep going, you've got this!"}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  clouds: {
    opacity: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  noStressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent.purple}15`,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  noStressText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.accent.purple,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 20,
    color: COLORS.text.primary,
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  explanationCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  explanationCorrect: {
    backgroundColor: '#E8F5E9',
  },
  explanationWrong: {
    backgroundColor: '#FFEBEE',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  explanationTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  explanationText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  checkButtonContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  checkButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: 'white',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  mascotMessage: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 10,
    textAlign: 'center',
  },
});
