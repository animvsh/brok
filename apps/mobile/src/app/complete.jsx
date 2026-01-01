import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/useTheme";
import { useAppFonts } from "@/components/useFonts";
import { Trophy, CheckCircle, Sparkles } from "lucide-react-native";

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { fontsLoaded } = useAppFonts();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const xp = parseInt(params.xp) || 0;
  const correct = parseInt(params.correct) || 0;
  const total = parseInt(params.total) || 1;
  const moduleCompleted = params.moduleCompleted === "true";
  const accuracy = Math.round((correct / total) * 100);

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = () => {
    queryClient.invalidateQueries(["activeCourse"]);
    queryClient.invalidateQueries(["stats"]);
    router.replace("/home");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 20,
      }}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: moduleCompleted ? "#FFD700" : "#4CAF50",
            borderRadius: 60,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {moduleCompleted ? (
            <Trophy size={60} color="#FFFFFF" />
          ) : (
            <CheckCircle size={60} color="#FFFFFF" />
          )}
        </View>

        <Text
          style={{
            fontFamily: "Montserrat_700Bold",
            fontSize: 32,
            color: theme.text,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {moduleCompleted ? "Module Complete!" : "Great Session!"}
        </Text>

        <Text
          style={{
            fontFamily: "Urbanist_400Regular",
            fontSize: 16,
            color: theme.secondaryText,
            marginBottom: 48,
            textAlign: "center",
          }}
        >
          {moduleCompleted
            ? "You've mastered this module"
            : "Keep up the momentum"}
        </Text>

        <View
          style={{
            width: "100%",
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "Urbanist_500Medium",
                fontSize: 16,
                color: theme.secondaryText,
              }}
            >
              XP Earned
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={20} color="#FFD700" />
              <Text
                style={{
                  fontFamily: "Montserrat_700Bold",
                  fontSize: 28,
                  color: theme.text,
                }}
              >
                +{xp}
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: theme.border,
              marginBottom: 20,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Urbanist_500Medium",
                fontSize: 16,
                color: theme.secondaryText,
              }}
            >
              Accuracy
            </Text>
            <Text
              style={{
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 20,
                color: theme.text,
              }}
            >
              {accuracy}%
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Urbanist_500Medium",
                fontSize: 16,
                color: theme.secondaryText,
              }}
            >
              Questions
            </Text>
            <Text
              style={{
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 20,
                color: theme.text,
              }}
            >
              {correct}/{total}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleContinue}
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
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}
