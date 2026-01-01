import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/components/useTheme';

export default function ErrorReversal({ unit, onSubmit, loading }) {
  const theme = useTheme();
  const [explanation, setExplanation] = useState('');
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('explain'); // 'explain' | 'result'

  const content = unit.content || {};
  const wrongAnswer = content.wrongAnswer || '';
  const prompt = content.prompt || "Explain why this answer is incorrect";
  const context = content.context || '';
  const targetMisconception = content.targetMisconception || '';

  const handleSubmit = async () => {
    if (!explanation.trim() || loading) return;

    const response = {
      explanation: explanation.trim(),
      targetMisconception,
    };
    const submitResult = await onSubmit(response);

    setResult(submitResult);
    setPhase('result');
  };

  const isCorrect = result?.gradedResult?.correct;

  // Explanation phase
  if (phase === 'explain') {
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
            marginBottom: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: '#FFEBEE',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AlertTriangle size={24} color="#C62828" />
          </View>
          <View>
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 14,
                color: '#C62828',
              }}
            >
              ERROR REVERSAL
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 12,
                color: theme.secondaryText,
              }}
            >
              Identify and explain the mistake
            </Text>
          </View>
        </View>

        {/* Context (if provided) */}
        {context && (
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 12,
                color: theme.secondaryText,
                marginBottom: 8,
              }}
            >
              CONTEXT
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 14,
                color: theme.text,
                lineHeight: 22,
              }}
            >
              {context}
            </Text>
          </View>
        )}

        {/* Wrong Answer Display */}
        <View
          style={{
            backgroundColor: '#FFEBEE',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#F44336',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              gap: 8,
            }}
          >
            <XCircle size={20} color="#C62828" />
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 12,
                color: '#C62828',
              }}
            >
              INCORRECT ANSWER
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Urbanist_500Medium',
              fontSize: 16,
              color: '#C62828',
              lineHeight: 24,
            }}
          >
            {wrongAnswer}
          </Text>
        </View>

        {/* Prompt */}
        <Text
          style={{
            fontFamily: 'Urbanist_600SemiBold',
            fontSize: 18,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 26,
          }}
        >
          {prompt}
        </Text>

        {/* Explanation Input */}
        <TextInput
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Explain why this is wrong and what the correct understanding should be..."
          placeholderTextColor={theme.tertiaryText}
          multiline
          style={{
            backgroundColor: theme.elevatedCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            minHeight: 150,
            fontFamily: 'Urbanist_400Regular',
            fontSize: 16,
            color: theme.text,
            textAlignVertical: 'top',
          }}
        />

        {/* Tips */}
        <View
          style={{
            backgroundColor: '#FFF8E1',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 12,
              color: '#F57F17',
              marginBottom: 8,
            }}
          >
            TIPS FOR A GOOD EXPLANATION
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist_400Regular',
              fontSize: 13,
              color: '#F57F17',
              lineHeight: 20,
            }}
          >
            • Identify the specific error or misconception{'\n'}
            • Explain why this thinking is flawed{'\n'}
            • State the correct concept or approach
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!explanation.trim() || loading}
          style={{
            marginTop: 24,
            backgroundColor: explanation.trim() && !loading ? '#000000' : theme.border,
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
              Submit Explanation
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
      {/* Result Header */}
      <View
        style={{
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          {isCorrect ? (
            <CheckCircle size={40} color="#4CAF50" />
          ) : (
            <AlertTriangle size={40} color="#C62828" />
          )}
        </View>
        <Text
          style={{
            fontFamily: 'Montserrat_700Bold',
            fontSize: 24,
            color: isCorrect ? '#2E7D32' : '#C62828',
          }}
        >
          {isCorrect ? 'Misconception Cleared!' : 'Not Quite Right'}
        </Text>
      </View>

      {/* Feedback */}
      <View
        style={{
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 15,
            color: isCorrect ? '#2E7D32' : '#C62828',
            lineHeight: 24,
          }}
        >
          {result?.gradedResult?.feedback}
        </Text>
      </View>

      {/* Your Explanation */}
      <View
        style={{
          backgroundColor: theme.elevatedCard,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
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
          YOUR EXPLANATION
        </Text>
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 14,
            color: theme.text,
            lineHeight: 22,
          }}
        >
          {explanation}
        </Text>
      </View>

      {/* Expected Explanation (if not correct) */}
      {!isCorrect && content.expectedExplanation && (
        <View
          style={{
            backgroundColor: '#E3F2FD',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 14,
              color: '#1565C0',
              marginBottom: 12,
            }}
          >
            EXPECTED EXPLANATION
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist_400Regular',
              fontSize: 14,
              color: '#1565C0',
              lineHeight: 22,
            }}
          >
            {content.expectedExplanation}
          </Text>
        </View>
      )}

      {/* Misconception Badge */}
      {isCorrect && targetMisconception && (
        <View
          style={{
            backgroundColor: '#E8F5E9',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#4CAF50',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CheckCircle size={24} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Montserrat_600SemiBold',
                  fontSize: 14,
                  color: '#2E7D32',
                }}
              >
                Misconception Resolved
              </Text>
              <Text
                style={{
                  fontFamily: 'Urbanist_400Regular',
                  fontSize: 13,
                  color: '#388E3C',
                  marginTop: 2,
                }}
              >
                This error pattern has been cleared from your record
              </Text>
            </View>
          </View>
        </View>
      )}

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
