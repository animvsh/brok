import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, XCircle, Target } from 'lucide-react-native';
import { useTheme } from '@/components/useTheme';

export default function DrillSet({ unit, onSubmit, loading }) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showItemResult, setShowItemResult] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('drill'); // 'drill' | 'complete'

  const content = unit.content || {};
  const items = content.items || [];
  const currentItem = items[currentIndex];

  const handleAnswer = (answer) => {
    setCurrentAnswer(answer);
  };

  const handleCheck = () => {
    if (!currentAnswer && currentItem?.type !== 'multiple_choice') return;

    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setShowItemResult(true);
  };

  const handleNext = async () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer('');
      setShowItemResult(false);
    } else {
      // Submit all answers
      const response = { answers };
      const submitResult = await onSubmit(response);
      setResult(submitResult);
      setPhase('complete');
    }
  };

  // Check if current answer is correct (simplified check)
  const isItemCorrect = () => {
    if (!currentItem) return false;
    const expected = String(currentItem.answer).toLowerCase().trim();
    const given = String(currentAnswer).toLowerCase().trim();
    return expected === given;
  };

  // Drill phase
  if (phase === 'drill') {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
            gap: 12,
          }}
        >
          <Target size={24} color={theme.secondaryText} />
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 14,
              color: theme.secondaryText,
            }}
          >
            {currentIndex + 1} of {items.length}
          </Text>
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: theme.progressBackground,
              borderRadius: 3,
            }}
          >
            <View
              style={{
                width: `${((currentIndex + 1) / items.length) * 100}%`,
                height: '100%',
                backgroundColor: theme.progressFill,
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* Question */}
        <Text
          style={{
            fontFamily: 'Urbanist_600SemiBold',
            fontSize: 20,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 28,
          }}
        >
          {currentItem?.question}
        </Text>

        {/* Answer Input based on type */}
        {currentItem?.type === 'multiple_choice' && currentItem?.options ? (
          <View style={{ gap: 12 }}>
            {currentItem.options.map((option, index) => {
              const isSelected = currentAnswer === option;
              const showCorrect = showItemResult && option === currentItem.answer;
              const showWrong = showItemResult && isSelected && !isItemCorrect();

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswer(option)}
                  disabled={showItemResult}
                  style={{
                    backgroundColor: showCorrect
                      ? '#E8F5E9'
                      : showWrong
                      ? '#FFEBEE'
                      : isSelected
                      ? theme.selectedChip
                      : theme.cardBackground,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: showCorrect
                      ? '#4CAF50'
                      : showWrong
                      ? '#F44336'
                      : isSelected
                      ? theme.selectedChip
                      : theme.border,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: 'Urbanist_500Medium',
                      fontSize: 15,
                      color: showCorrect
                        ? '#2E7D32'
                        : showWrong
                        ? '#C62828'
                        : isSelected
                        ? theme.selectedChipText
                        : theme.text,
                    }}
                  >
                    {option}
                  </Text>
                  {showCorrect && <CheckCircle size={20} color="#4CAF50" />}
                  {showWrong && <XCircle size={20} color="#F44336" />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            value={currentAnswer}
            onChangeText={handleAnswer}
            placeholder="Type your answer..."
            placeholderTextColor={theme.tertiaryText}
            editable={!showItemResult}
            style={{
              backgroundColor: showItemResult
                ? isItemCorrect()
                  ? '#E8F5E9'
                  : '#FFEBEE'
                : theme.elevatedCard,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: showItemResult
                ? isItemCorrect()
                  ? '#4CAF50'
                  : '#F44336'
                : theme.border,
              padding: 20,
              fontFamily: 'Urbanist_500Medium',
              fontSize: 18,
              color: showItemResult
                ? isItemCorrect()
                  ? '#2E7D32'
                  : '#C62828'
                : theme.text,
            }}
          />
        )}

        {/* Feedback after answer */}
        {showItemResult && (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: isItemCorrect() ? '#E8F5E9' : '#FFF3E0',
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'Urbanist_500Medium',
                fontSize: 14,
                color: isItemCorrect() ? '#2E7D32' : '#E65100',
              }}
            >
              {isItemCorrect()
                ? 'Correct!'
                : `The answer is: ${currentItem?.answer}`}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {!showItemResult ? (
          <TouchableOpacity
            onPress={handleCheck}
            disabled={!currentAnswer || loading}
            style={{
              marginTop: 24,
              backgroundColor: currentAnswer && !loading ? '#000000' : theme.border,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              Check
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={{
              marginTop: 24,
              backgroundColor: '#000000',
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontFamily: 'Montserrat_600SemiBold',
                  fontSize: 16,
                  color: '#FFFFFF',
                }}
              >
                {currentIndex < items.length - 1 ? 'Next' : 'Finish Drill'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Complete phase
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: '#E8F5E9',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Target size={40} color="#4CAF50" />
        </View>
        <Text
          style={{
            fontFamily: 'Montserrat_700Bold',
            fontSize: 24,
            color: theme.text,
          }}
        >
          Drill Complete!
        </Text>
      </View>

      {/* Results */}
      <View
        style={{
          backgroundColor: theme.elevatedCard,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'Montserrat_600SemiBold',
            fontSize: 14,
            color: theme.secondaryText,
            marginBottom: 16,
          }}
        >
          YOUR RESULTS
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 32,
                color: theme.text,
              }}
            >
              {result?.gradedResult?.correct_count || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 14,
                color: theme.secondaryText,
              }}
            >
              Correct
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 32,
                color: theme.text,
              }}
            >
              {items.length}
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 14,
                color: theme.secondaryText,
              }}
            >
              Total
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 32,
                color: '#4CAF50',
              }}
            >
              {Math.round((result?.gradedResult?.score || 0) * 100)}%
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 14,
                color: theme.secondaryText,
              }}
            >
              Score
            </Text>
          </View>
        </View>
      </View>

      {/* Feedback */}
      <Text
        style={{
          fontFamily: 'Urbanist_400Regular',
          fontSize: 16,
          color: theme.text,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        {result?.gradedResult?.feedback}
      </Text>
    </ScrollView>
  );
}
