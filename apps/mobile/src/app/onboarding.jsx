import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, Zap } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Topic suggestions
const TOPICS = [
  { id: 'data-structures', label: 'Data Structures', emoji: '🧠' },
  { id: 'guitar', label: 'Guitar', emoji: '🎸' },
  { id: 'psychology', label: 'Psychology', emoji: '🧬' },
  { id: 'investing', label: 'Investing', emoji: '📈' },
  { id: 'public-speaking', label: 'Public Speaking', emoji: '🎤' },
  { id: 'python', label: 'Python', emoji: '🐍' },
];

// Why options
const WHY_OPTIONS = [
  { id: 'fun', label: 'Fun', emoji: '✨' },
  { id: 'school', label: 'School', emoji: '📚' },
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'curiosity', label: 'Curiosity', emoji: '🔍' },
];

// Intensity options
const INTENSITY_OPTIONS = [
  { id: 'chill', label: 'Chill', desc: '5 min/day', emoji: '🌿' },
  { id: 'balanced', label: 'Balanced', desc: '10 min/day', emoji: '⚖️' },
  { id: 'intense', label: 'Intense', desc: '20 min/day', emoji: '🔥' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();

  const [step, setStep] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedWhy, setSelectedWhy] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) return null;

  const animateNext = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setTimeout(() => animateNext(() => setStep(1)), 200);
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      setSelectedTopic({ id: 'custom', label: searchText.trim() });
      animateNext(() => setStep(1));
    }
  };

  const handleWhySelect = (why) => {
    setSelectedWhy(why);
    setTimeout(() => animateNext(() => setStep(2)), 200);
  };

  const handleIntensitySelect = async (intensity) => {
    setSelectedIntensity(intensity);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/threads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          input: selectedTopic.label,
          why: selectedWhy?.id,
          intensity: intensity.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace({
          pathname: '/skillcheck',
          params: { threadId: data.threadId },
        });
      } else {
        throw new Error(data.error || 'Failed to create');
      }
    } catch (error) {
      console.error('Error:', error);
      // Still proceed to skill check for demo
      router.replace('/skillcheck');
    } finally {
      setLoading(false);
    }
  };

  // Step 0: What do you want to learn?
  const renderStep0 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>What do you want to learn?</Text>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="learn literally anything..."
          placeholderTextColor={COLORS.text.muted}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="go"
        />
      </View>

      {/* Topic cards */}
      <View style={styles.topicsGrid}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.topicCard}
            onPress={() => handleTopicSelect(topic)}
            activeOpacity={0.8}
          >
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            <Text style={styles.topicLabel}>{topic.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // Step 1: Why are you learning this?
  const renderStep1 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>Why are you learning {selectedTopic?.label}?</Text>
      <Text style={styles.subtitle}>This helps me personalize your journey</Text>

      <View style={styles.optionsContainer}>
        {WHY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedWhy?.id === option.id && styles.optionCardSelected,
            ]}
            onPress={() => handleWhySelect(option)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <ChevronRight size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // Step 2: How intense?
  const renderStep2 = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={styles.title}>How intense?</Text>
      <Text style={styles.subtitle}>You can change this anytime</Text>

      <View style={styles.intensityContainer}>
        {INTENSITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.intensityCard,
              selectedIntensity?.id === option.id && styles.intensityCardSelected,
            ]}
            onPress={() => handleIntensitySelect(option)}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.intensityEmoji}>{option.emoji}</Text>
            <Text style={styles.intensityLabel}>{option.label}</Text>
            <Text style={styles.intensityDesc}>{option.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Building your path...</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FAFBFF', '#F0F4FF', '#FFFFFF']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              step >= i && styles.progressDotActive,
              step === i && styles.progressDotCurrent,
            ]}
          />
        ))}
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
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotCurrent: {
    width: 24,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topicEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionLabel: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 17,
    color: COLORS.text.primary,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  intensityCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  intensityEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  intensityLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  intensityDesc: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
};
