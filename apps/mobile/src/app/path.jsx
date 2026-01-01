import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Circle, Lock } from "lucide-react-native";
import { useTheme } from "@/components/useTheme";
import { useAppFonts } from "@/components/useFonts";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/utils/auth";
import { supabase } from "@/utils/auth/supabase";

export default function PathScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const { fontsLoaded } = useAppFonts();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["activeCourse", user?.id],
    queryFn: async () => {
      if (!user?.id) return { course: null };

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!progress?.active_course_id) {
        return { course: null };
      }

      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', progress.active_course_id)
        .single();

      const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', progress.active_course_id)
        .order('module_order', { ascending: true });

      const { data: completions } = await supabase
        .from('module_completions')
        .select('module_id')
        .eq('user_id', user.id);

      const completedIds = new Set(completions?.map(c => c.module_id) || []);

      const modulesWithStatus = modules?.map(m => ({
        ...m,
        completed: completedIds.has(m.id)
      })) || [];

      const { data: currentModule } = await supabase
        .from('modules')
        .select('*')
        .eq('id', progress.current_module_id)
        .single();

      return { course, modules: modulesWithStatus, currentModule, progress };
    },
    enabled: !!user?.id,
  });

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

  const course = data?.course;
  const modules = data?.modules || [];
  const currentModule = data?.currentModule;

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <AppHeader
        leftIcon={ArrowLeft}
        rightIcon={null}
        onLeftPress={handleBack}
        title="Course Path"
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 100,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <Text
          style={{
            fontFamily: "Montserrat_700Bold",
            fontSize: 28,
            color: theme.text,
            marginBottom: 12,
          }}
        >
          {course?.title}
        </Text>

        <Text
          style={{
            fontFamily: "Urbanist_400Regular",
            fontSize: 15,
            color: theme.secondaryText,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {course?.description}
        </Text>

        {modules.map((module, index) => {
          const isCompleted = module.completed;
          const isCurrent = currentModule?.id === module.id;
          const isLocked = !isCompleted && !isCurrent;

          return (
            <View key={module.id} style={{ marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: isCompleted
                    ? theme.elevatedCard
                    : isCurrent
                      ? theme.cardBackground
                      : theme.cardBackground,
                  borderRadius: 16,
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? theme.text : theme.border,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isCompleted
                      ? "#4CAF50"
                      : isCurrent
                        ? theme.text
                        : theme.unselectedChip,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle size={24} color="#FFFFFF" />
                  ) : isLocked ? (
                    <Lock size={24} color={theme.tertiaryText} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Montserrat_700Bold",
                        fontSize: 18,
                        color: isCurrent
                          ? theme.background
                          : theme.secondaryText,
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Urbanist_600SemiBold",
                      fontSize: 16,
                      color: isCompleted ? theme.secondaryText : theme.text,
                      marginBottom: 4,
                    }}
                  >
                    {module.title}
                  </Text>

                  {isCurrent && (
                    <Text
                      style={{
                        fontFamily: "Urbanist_500Medium",
                        fontSize: 12,
                        color: theme.secondaryText,
                      }}
                    >
                      In Progress
                    </Text>
                  )}

                  {isCompleted && (
                    <Text
                      style={{
                        fontFamily: "Urbanist_500Medium",
                        fontSize: 12,
                        color: "#4CAF50",
                      }}
                    >
                      Completed
                    </Text>
                  )}

                  {isLocked && (
                    <Text
                      style={{
                        fontFamily: "Urbanist_500Medium",
                        fontSize: 12,
                        color: theme.tertiaryText,
                      }}
                    >
                      Locked
                    </Text>
                  )}
                </View>

                {isCompleted && <CheckCircle size={24} color="#4CAF50" />}
              </View>

              {index < modules.length - 1 && (
                <View
                  style={{
                    width: 2,
                    height: 20,
                    backgroundColor: theme.border,
                    marginLeft: 44,
                    marginVertical: 4,
                  }}
                />
              )}
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}
