import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppFonts } from "@/components/useFonts";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { useAuth } from "@/utils/auth";
import GradientBackground from "@/components/ui/GradientBackground";
import PillOption from "@/components/ui/PillOption";
import BrokMascot from "@/components/mascot/BrokMascot";
import FloatingClouds from "@/components/ui/FloatingClouds";
import { COLORS } from "@/components/theme/colors";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const TOPICS = [
  { id: "guitar", label: "Guitar", icon: "guitar" },
  { id: "data-structures", label: "Data Structures", icon: "code" },
  { id: "psychology", label: "Psychology", icon: "psychology" },
  { id: "fitness", label: "Fitness", icon: "fitness" },
  { id: "programming", label: "Programming", icon: "laptop" },
  { id: "languages", label: "Languages", icon: "languages" },
  { id: "math", label: "Math", icon: "math" },
  { id: "science", label: "Science", icon: "science" },
  { id: "custom", label: "Something Else", icon: "sparkles" },
];

const REASONS = [
  { id: "fun", label: "Just for fun!", icon: "smile" },
  { id: "school", label: "For school", icon: "graduation-cap" },
  { id: "career", label: "Career growth", icon: "briefcase" },
  { id: "curiosity", label: "Curiosity", icon: "search" },
  { id: "hobby", label: "New hobby", icon: "heart" },
  { id: "challenge", label: "Challenge myself", icon: "trophy" },
];

const GRADIENT_VARIANTS = ["warmSunset", "coolOcean", "softPink", "purpleDream"];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();

  // Step state: 0 = topic, 1 = reason, 2 = custom input
  const [step, setStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mascotMood, setMascotMood] = useState("happy");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) return null;

  const getGradientVariant = () => GRADIENT_VARIANTS[step % GRADIENT_VARIANTS.length];

  const animateTransition = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(() => setStep(step - 1));
    } else {
      router.back();
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setMascotMood("excited");

    setTimeout(() => {
      if (topic.id === "custom") {
        animateTransition(() => setStep(2));
      } else {
        animateTransition(() => setStep(1));
      }
    }, 300);
  };

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    setMascotMood("celebrating");

    setTimeout(() => {
      handleCreate(selectedTopic.label, reason.label);
    }, 500);
  };

  const handleCreate = async (topic, reason) => {
    const inputText = topic === "Something Else"
      ? customInput.trim()
      : `${topic}${reason ? ` - ${reason}` : ""}`;

    if (!inputText) {
      Alert.alert("Hold on", "Tell me what you want to learn!");
      return;
    }

    if (!API_URL) {
      Alert.alert("Configuration Error", "The app is not properly configured.");
      return;
    }

    if (!session?.access_token) {
      Alert.alert("Not logged in", "Please log in to create a learning thread");
      return;
    }

    setLoading(true);
    setMascotMood("thinking");

    try {
      const response = await fetch(`${API_URL}/api/threads/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ input: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create learning thread");
      }

      router.replace({
        pathname: "/action",
        params: { threadId: data.threadId },
      });
    } catch (error) {
      console.error("Thread creation error:", error);
      setMascotMood("happy");
      Alert.alert(
        "Oops!",
        error.message || "Couldn't create your learning path. Try again?"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep0 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>Pick a topic that excites you!</Text>

      <View style={styles.pillContainer}>
        {TOPICS.map((topic) => (
          <PillOption
            key={topic.id}
            label={topic.label}
            icon={topic.icon}
            selected={selectedTopic?.id === topic.id}
            onPress={() => handleTopicSelect(topic)}
            size="large"
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderStep1 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>Why {selectedTopic?.label}?</Text>
      <Text style={styles.subtitle}>This helps me personalize your journey!</Text>

      <View style={styles.pillContainer}>
        {REASONS.map((reason) => (
          <PillOption
            key={reason.id}
            label={reason.label}
            icon={reason.icon}
            selected={selectedReason?.id === reason.id}
            onPress={() => handleReasonSelect(reason)}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>Tell me more!</Text>
      <Text style={styles.subtitle}>What would you like to learn?</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={customInput}
          onChangeText={setCustomInput}
          placeholder="e.g., I want to learn Python to build web apps..."
          placeholderTextColor={COLORS.text.muted}
          style={styles.textInput}
          autoFocus
          multiline
          textAlignVertical="top"
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        onPress={() => handleCreate("Something Else", null)}
        disabled={!customInput.trim() || loading}
        style={[
          styles.continueButton,
          (!customInput.trim() || loading) && styles.continueButtonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Sparkles size={20} color="white" />
            <Text style={styles.continueButtonText}>Start Learning</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLoadingOverlay = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <BrokMascot size={120} mood="thinking" />
        <Text style={styles.loadingText}>Building your skill map...</Text>
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 16 }} />
      </View>
    );
  };

  return (
    <GradientBackground variant={getGradientVariant()}>
      <StatusBar barStyle="dark-content" />

      {/* Floating clouds at bottom */}
      <FloatingClouds variant="bottom" />

      {/* Mascot at bottom center */}
      <View style={styles.mascotContainer}>
        <BrokMascot size={100} mood={mascotMood} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              disabled={loading}
              style={[styles.backButton, loading && { opacity: 0.5 }]}
            >
              <ArrowLeft size={24} color={COLORS.text.primary} />
            </TouchableOpacity>

            {/* Progress dots */}
            <View style={styles.progressDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    step >= i && styles.dotActive,
                    step === i && styles.dotCurrent,
                  ]}
                />
              ))}
            </View>

            <View style={{ width: 48 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </ScrollView>

          {renderLoadingOverlay()}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  dotCurrent: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 180, // Space for mascot and clouds
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 28,
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontFamily: "Urbanist_500Medium",
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  pillContainer: {
    gap: 4,
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    fontFamily: "Urbanist_500Medium",
    fontSize: 17,
    color: COLORS.text.primary,
    minHeight: 120,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.text.muted,
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: "white",
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: COLORS.text.primary,
    marginTop: 20,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
