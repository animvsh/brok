import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BookOpen, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/components/useTheme';

export default function MicroTeachThenCheck({ unit, onSubmit, loading }) {
  const theme = useTheme();
  const [phase, setPhase] = useState('teach'); // 'teach' | 'check' | 'result'
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  const content = unit.content || {};
  const explanation = content.explanation || {};
  const checkQuestion = content.checkQuestion || {};

  const handleContinueToCheck = () => {
    setPhase('check');
  };

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;

    const response = { text: answer.trim() };
    const submitResult = await onSubmit(response);

    setResult(submitResult);
    setPhase('result');
  };

  const isCorrect = result?.gradedResult?.correct;

  // Teaching phase
  if (phase === 'teach') {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: '#E3F2FD',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <BookOpen size={24} color="#1976D2" />
          </View>
          <View>
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 14,
                color: '#1976D2',
              }}
            >
              LEARN
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 12,
                color: theme.secondaryText,
              }}
            >
              Read carefully, then check your understanding
            </Text>
          </View>
        </View>

        {/* Explanation Content */}
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 16,
            color: theme.text,
            lineHeight: 26,
            marginBottom: 24,
          }}
        >
          {explanation.content}
        </Text>

        {/* Key Points */}
        {explanation.keyPoints && explanation.keyPoints.length > 0 && (
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
                marginBottom: 12,
              }}
            >
              KEY POINTS
            </Text>
            {explanation.keyPoints.map((point, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <CheckCircle size={18} color="#4CAF50" />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Urbanist_500Medium',
                    fontSize: 14,
                    color: theme.text,
                    lineHeight: 20,
                  }}
                >
                  {point}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Examples */}
        {explanation.examples && explanation.examples.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 14,
                color: theme.secondaryText,
                marginBottom: 12,
              }}
            >
              EXAMPLES
            </Text>
            {explanation.examples.map((example, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Urbanist_500Medium',
                    fontSize: 14,
                    color: theme.secondaryText,
                  }}
                >
                  {example.input}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Urbanist_600SemiBold',
                    fontSize: 15,
                    color: theme.text,
                    marginTop: 8,
                  }}
                >
                  {example.output}
                </Text>
                {example.explanation && (
                  <Text
                    style={{
                      fontFamily: 'Urbanist_400Regular',
                      fontSize: 13,
                      color: theme.tertiaryText,
                      marginTop: 4,
                    }}
                  >
                    {example.explanation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinueToCheck}
          style={{
            backgroundColor: '#000000',
            paddingVertical: 20,
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
            I've Got It - Test Me
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Check phase
  if (phase === 'check') {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: 'Urbanist_600SemiBold',
            fontSize: 22,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 30,
          }}
        >
          {checkQuestion.question}
        </Text>

        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Type your answer..."
          placeholderTextColor={theme.tertiaryText}
          multiline
          style={{
            backgroundColor: theme.elevatedCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            minHeight: 120,
            fontFamily: 'Urbanist_400Regular',
            fontSize: 16,
            color: theme.text,
            textAlignVertical: 'top',
          }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!answer.trim() || loading}
          style={{
            marginTop: 24,
            backgroundColor: answer.trim() && !loading ? '#000000' : theme.border,
            paddingVertical: 20,
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
              Submit Answer
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Result phase
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          padding: 24,
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'Montserrat_700Bold',
            fontSize: 24,
            color: isCorrect ? '#2E7D32' : '#C62828',
            marginBottom: 8,
          }}
        >
          {isCorrect ? 'Well done!' : 'Almost there!'}
        </Text>
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 16,
            color: isCorrect ? '#2E7D32' : '#C62828',
            lineHeight: 24,
          }}
        >
          {result?.gradedResult?.feedback}
        </Text>
      </View>

      {/* Mastery Update */}
      {result?.masteryUpdate && (
        <View
          style={{
            backgroundColor: theme.elevatedCard,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 14,
              color: theme.secondaryText,
              marginBottom: 12,
            }}
          >
            MASTERY PROGRESS
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Urbanist_500Medium', color: theme.text }}>
              {Math.round(result.masteryUpdate.after.p * 100)}%
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_500Medium',
                color: result.masteryUpdate.delta.p > 0 ? '#4CAF50' : '#F44336',
              }}
            >
              {result.masteryUpdate.delta.p > 0 ? '+' : ''}
              {Math.round(result.masteryUpdate.delta.p * 100)}%
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
