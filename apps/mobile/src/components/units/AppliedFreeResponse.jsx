import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Lightbulb, ChevronDown, ChevronUp, Award } from 'lucide-react-native';
import { useTheme } from '@/components/useTheme';

export default function AppliedFreeResponse({ unit, onSubmit, loading }) {
  const theme = useTheme();
  const [answer, setAnswer] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('answer'); // 'answer' | 'result'

  const content = unit.content || {};
  const scenario = content.scenario || '';
  const prompt = content.prompt || '';
  const hints = content.hints || [];
  const rubric = content.rubric || [];

  const handleRevealHint = () => {
    if (hintsUsed < hints.length) {
      setHintsUsed(hintsUsed + 1);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;

    const response = {
      text: answer.trim(),
      hintsUsed,
    };
    const submitResult = await onSubmit(response);

    setResult(submitResult);
    setPhase('result');
  };

  const score = result?.gradedResult?.score || 0;
  const scorePercent = Math.round(score * 100);

  // Answer phase
  if (phase === 'answer') {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            gap: 8,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFF3E0',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Award size={16} color="#E65100" />
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 12,
                color: '#E65100',
              }}
            >
              APPLIED CHALLENGE
            </Text>
          </View>
        </View>

        {/* Scenario */}
        <View
          style={{
            backgroundColor: theme.elevatedCard,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: '#FF9800',
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
            SCENARIO
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist_400Regular',
              fontSize: 15,
              color: theme.text,
              lineHeight: 24,
            }}
          >
            {scenario}
          </Text>
        </View>

        {/* Prompt */}
        <Text
          style={{
            fontFamily: 'Urbanist_600SemiBold',
            fontSize: 20,
            color: theme.text,
            marginBottom: 20,
            lineHeight: 28,
          }}
        >
          {prompt}
        </Text>

        {/* Rubric Preview */}
        {rubric.length > 0 && (
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 12,
                color: theme.secondaryText,
                marginBottom: 12,
              }}
            >
              YOU'LL BE GRADED ON
            </Text>
            {rubric.map((criterion, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.secondaryText,
                  }}
                />
                <Text
                  style={{
                    fontFamily: 'Urbanist_500Medium',
                    fontSize: 14,
                    color: theme.text,
                    flex: 1,
                  }}
                >
                  {criterion.criterion}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Answer Input */}
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Write your response here..."
          placeholderTextColor={theme.tertiaryText}
          multiline
          style={{
            backgroundColor: theme.elevatedCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            minHeight: 180,
            fontFamily: 'Urbanist_400Regular',
            fontSize: 16,
            color: theme.text,
            textAlignVertical: 'top',
          }}
        />

        {/* Hints Section */}
        {hints.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => setShowHints(!showHints)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lightbulb size={20} color={theme.secondaryText} />
                <Text
                  style={{
                    fontFamily: 'Urbanist_500Medium',
                    fontSize: 14,
                    color: theme.secondaryText,
                  }}
                >
                  Need help? ({hintsUsed}/{hints.length} hints used)
                </Text>
              </View>
              {showHints ? (
                <ChevronUp size={20} color={theme.secondaryText} />
              ) : (
                <ChevronDown size={20} color={theme.secondaryText} />
              )}
            </TouchableOpacity>

            {showHints && (
              <View style={{ gap: 12 }}>
                {hints.slice(0, hintsUsed).map((hint, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#FFF8E1',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Urbanist_500Medium',
                        fontSize: 14,
                        color: '#F57F17',
                      }}
                    >
                      Hint {index + 1}: {hint}
                    </Text>
                  </View>
                ))}

                {hintsUsed < hints.length && (
                  <TouchableOpacity
                    onPress={handleRevealHint}
                    style={{
                      backgroundColor: theme.cardBackground,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderStyle: 'dashed',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Urbanist_500Medium',
                        fontSize: 14,
                        color: theme.secondaryText,
                      }}
                    >
                      Reveal next hint
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Submit Button */}
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
              Submit Response
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
      {/* Score Header */}
      <View
        style={{
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: scorePercent >= 70 ? '#E8F5E9' : '#FFEBEE',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_700Bold',
              fontSize: 32,
              color: scorePercent >= 70 ? '#2E7D32' : '#C62828',
            }}
          >
            {scorePercent}%
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Montserrat_600SemiBold',
            fontSize: 20,
            color: theme.text,
          }}
        >
          {scorePercent >= 90
            ? 'Excellent!'
            : scorePercent >= 70
            ? 'Good Work!'
            : scorePercent >= 50
            ? 'Getting There'
            : 'Keep Practicing'}
        </Text>
      </View>

      {/* Feedback */}
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
          FEEDBACK
        </Text>
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 15,
            color: theme.text,
            lineHeight: 24,
          }}
        >
          {result?.gradedResult?.feedback}
        </Text>
      </View>

      {/* Criteria Breakdown */}
      {result?.gradedResult?.criteria_scores && (
        <View
          style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border,
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
            CRITERIA BREAKDOWN
          </Text>
          {Object.entries(result.gradedResult.criteria_scores).map(
            ([criterion, score], index) => (
              <View key={index} style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Urbanist_500Medium',
                      fontSize: 14,
                      color: theme.text,
                      flex: 1,
                    }}
                  >
                    {criterion}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Montserrat_600SemiBold',
                      fontSize: 14,
                      color: score >= 0.7 ? '#4CAF50' : '#FF9800',
                    }}
                  >
                    {Math.round(score * 100)}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: theme.progressBackground,
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      width: `${score * 100}%`,
                      height: '100%',
                      backgroundColor: score >= 0.7 ? '#4CAF50' : '#FF9800',
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            )
          )}
        </View>
      )}

      {/* Strengths */}
      {result?.gradedResult?.strengths?.length > 0 && (
        <View
          style={{
            backgroundColor: '#E8F5E9',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 14,
              color: '#2E7D32',
              marginBottom: 12,
            }}
          >
            STRENGTHS
          </Text>
          {result.gradedResult.strengths.map((strength, index) => (
            <Text
              key={index}
              style={{
                fontFamily: 'Urbanist_500Medium',
                fontSize: 14,
                color: '#2E7D32',
                marginBottom: 4,
              }}
            >
              • {strength}
            </Text>
          ))}
        </View>
      )}

      {/* Improvements */}
      {result?.gradedResult?.improvements?.length > 0 && (
        <View
          style={{
            backgroundColor: '#FFF3E0',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 14,
              color: '#E65100',
              marginBottom: 12,
            }}
          >
            AREAS TO IMPROVE
          </Text>
          {result.gradedResult.improvements.map((improvement, index) => (
            <Text
              key={index}
              style={{
                fontFamily: 'Urbanist_500Medium',
                fontSize: 14,
                color: '#E65100',
                marginBottom: 4,
              }}
            >
              • {improvement}
            </Text>
          ))}
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
