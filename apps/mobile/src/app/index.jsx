import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAppFonts } from "@/components/useFonts";
import { Sparkles } from "lucide-react-native";
import { useAuth } from "@/utils/auth";
import { supabase } from "@/utils/auth/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://iqqkdhifygfrqpxedtgk.supabase.co/functions/v1';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user, isReady, isAuthenticated } = useAuth();

  // Check if user has an active course
  const { data } = useQuery({
    queryKey: ["activeCourse", user?.id],
    queryFn: async () => {
      if (!user?.id) return { course: null };

      // Query directly from Supabase
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*, courses(*)')
        .eq('user_id', user.id)
        .single();

      return { course: progress?.courses || null };
    },
    enabled: !!user?.id,
  });

  if (!fontsLoaded || !isReady) {
    return null;
  }

  // If user has active course, redirect to home
  if (data?.course) {
    router.replace("/home");
    return null;
  }

  const handleStart = () => {
    router.push("/create");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: Math.max(insets.left, 10),
        paddingRight: Math.max(insets.right, 10),
      }}
    >
      <StatusBar barStyle="light-content" />

      <View
        style={{
          marginTop: 80,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 60,
          }}
        >
          <Sparkles size={50} color="#000000" />
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "Montserrat_700Bold",
            fontSize: 52,
            color: "#FFFFFF",
            lineHeight: 56,
            letterSpacing: 1,
            marginBottom: 24,
          }}
        >
          BROK
        </Text>

        <Text
          style={{
            fontFamily: "Urbanist_400Regular",
            fontSize: 18,
            color: "#CCCCCC",
            lineHeight: 28,
            letterSpacing: 0.3,
            marginBottom: 16,
          }}
        >
          A dynamic, mobile-first learning app.
        </Text>

        <Text
          style={{
            fontFamily: "Urbanist_400Regular",
            fontSize: 16,
            color: "#999999",
            lineHeight: 24,
            letterSpacing: 0.2,
          }}
        >
          Courses that adapt to you. Learning that feels natural. Progress
          that's always visible.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        <TouchableOpacity
          onPress={handleStart}
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 48,
            paddingVertical: 20,
            borderRadius: 30,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
          activeOpacity={0.9}
        >
          <Text
            style={{
              fontFamily: "Montserrat_600SemiBold",
              fontSize: 18,
              color: "#000000",
              letterSpacing: 0.5,
            }}
          >
            Start Learning
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
