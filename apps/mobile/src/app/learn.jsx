import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react-native";
import { useTheme } from "@/components/useTheme";
import { useAppFonts } from "@/components/useFonts";
import { useAuth } from "@/utils/auth";
import { supabase } from "@/utils/auth/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.error('EXPO_PUBLIC_API_URL is not configured');
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { fontsLoaded } = useAppFonts();
  const { user } = useAuth();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ["nextModule", user?.id],
    queryFn: async () => {
      if (!user?.id) return { questions: [] };

      const response = await fetch(`${API_URL}/api/modules/next?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuestionIndex]);

  if (!fontsLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const questions = data?.questions || [];
  const sessionId = data?.sessionId;
  const module = data?.module;

  if (questions.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        <Text
          style={{
            fontFamily: "Montserrat_600SemiBold",
            fontSize: 18,
            color: theme.text,
            textAlign: "center",
          }}
        >
          No questions available
        </Text>
      </View>
    );
  }

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleBack = () => {
    router.back();
  };

  const handleAnswerPress = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === question.correctAnswer;
    const responseTime = (Date.now() - startTime) / 1000;

    setAnswers([
      ...answers,
      {
        conceptId: question.conceptId,
        correct,
        responseTime,
      },
    ]);

    setShowResult(true);
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      try {
        const response = await fetch(`${API_URL}/api/modules/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            answers,
            userId: user?.id,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit");

        const result = await response.json();
        router.replace({
          pathname: "/complete",
          params: {
            xp: result.xpEarned,
            correct: result.totalCorrect,
            total: result.totalQuestions,
            moduleCompleted: result.moduleCompleted,
          },
        });
      } catch (error) {
        console.error('Submit error:', error);
        Alert.alert(
          'Submission Failed',
          'Could not save your progress. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  const renderQuestion = () => {
    if (question.type === "multiple_choice") {
      return (
        <View style={{ gap: 12 }}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === question.correctAnswer;

            let backgroundColor = theme.cardBackground;
            let borderColor = theme.border;
            let textColor = theme.text;

            if (showResult) {
              if (isCorrectAnswer) {
                backgroundColor = "#E8F5E9";
                borderColor = "#4CAF50";
                textColor = "#2E7D32";
              } else if (isSelected && !isCorrect) {
                backgroundColor = "#FFEBEE";
                borderColor = "#F44336";
                textColor = "#C62828";
              }
            } else if (isSelected) {
              backgroundColor = theme.selectedChip;
              borderColor = theme.selectedChip;
              textColor = theme.selectedChipText;
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswerPress(option)}
                disabled={showResult}
                style={{
                  backgroundColor,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "Urbanist_500Medium",
                    fontSize: 16,
                    color: textColor,
                    lineHeight: 22,
                  }}
                >
                  {option}
                </Text>

                {showResult && isCorrectAnswer && (
                  <CheckCircle size={24} color="#4CAF50" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle size={24} color="#F44336" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (question.type === "true_false") {
      return (
        <View style={{ gap: 12 }}>
          {["True", "False"].map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === question.correctAnswer;

            let backgroundColor = theme.cardBackground;
            let borderColor = theme.border;
            let textColor = theme.text;

            if (showResult) {
              if (isCorrectAnswer) {
                backgroundColor = "#E8F5E9";
                borderColor = "#4CAF50";
                textColor = "#2E7D32";
              } else if (isSelected && !isCorrect) {
                backgroundColor = "#FFEBEE";
                borderColor = "#F44336";
                textColor = "#C62828";
              }
            } else if (isSelected) {
              backgroundColor = theme.selectedChip;
              borderColor = theme.selectedChip;
              textColor = theme.selectedChipText;
            }

            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleAnswerPress(option)}
                disabled={showResult}
                style={{
                  backgroundColor,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "Urbanist_500Medium",
                    fontSize: 16,
                    color: textColor,
                  }}
                >
                  {option}
                </Text>

                {showResult && isCorrectAnswer && (
                  <CheckCircle size={24} color="#4CAF50" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle size={24} color="#F44336" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 24,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 48,
            height: 48,
            backgroundColor: theme.iconBackground,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            height: 8,
            backgroundColor: theme.progressBackground,
            borderRadius: 4,
            marginLeft: 16,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              height: "100%",
              backgroundColor: theme.progressFill,
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: "Montserrat_600SemiBold",
            fontSize: 14,
            color: theme.secondaryText,
            marginLeft: 12,
          }}
        >
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Urbanist_600SemiBold",
            fontSize: 26,
            color: theme.text,
            marginBottom: 32,
            lineHeight: 34,
          }}
        >
          {question.question}
        </Text>

        {renderQuestion()}

        {showResult && (
          <View
            style={{
              marginTop: 24,
              padding: 20,
              backgroundColor: isCorrect ? "#E8F5E9" : "#FFEBEE",
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Urbanist_600SemiBold",
                fontSize: 16,
                color: isCorrect ? "#2E7D32" : "#C62828",
                marginBottom: 8,
              }}
            >
              {isCorrect ? "Correct!" : "Not quite"}
            </Text>
            <Text
              style={{
                fontFamily: "Urbanist_400Regular",
                fontSize: 14,
                color: isCorrect ? "#2E7D32" : "#C62828",
                lineHeight: 20,
              }}
            >
              {question.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {!showResult ? (
          <TouchableOpacity
            onPress={handleCheckAnswer}
            disabled={selectedAnswer === null}
            style={{
              backgroundColor:
                selectedAnswer !== null ? "#000000" : theme.border,
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Check Answer
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: "#000000",
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              {isLastQuestion ? "Finish Session" : "Next Question"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
