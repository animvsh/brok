import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Music,
  Code,
  Brain,
  Dumbbell,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS, GRADIENTS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Topic options with icons
const TOPICS = [
  { id: 'guitar', label: 'Guitar', icon: Music, color: '#FF8A65' },
  { id: 'data-structures', label: 'Data Structures', icon: Code, color: '#64B5F6' },
  { id: 'psychology', label: 'Psychology', icon: Brain, color: '#BA68C8' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#4DB6AC' },
  { id: 'other', label: 'Something Else', icon: Sparkles, color: '#FFB74D' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) return null;

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic.id);
    if (topic.id === 'other') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomTopic('');
    }
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = async () => {
    const topicToSend = selectedTopic === 'other' ? customTopic.trim() : selectedTopic;

    if (!topicToSend) {
      Alert.alert('Pick a topic', 'What would you like to learn?');
      return;
    }

    if (selectedTopic === 'other' && customTopic.trim().length < 3) {
      Alert.alert('Too short', 'Tell me a bit more about what you want to learn!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/threads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          input: topicToSend,
          inputType: 'text',
        }),
      });

      const data = await response.json();

      if (response.ok && data.threadId) {
        router.replace({
          pathname: '/home',
          params: { threadId: data.threadId },
        });
      } else {
        throw new Error(data.error || 'Failed to create learning path');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Oops!',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFE5EC', '#E8D5FF', '#D5E5FF', '#E0F4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cloud decorations */}
      <View style={[styles.cloud, styles.cloud1]} />
      <View style={[styles.cloud, styles.cloud2]} />
      <View style={[styles.cloud, styles.cloud3]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>What do you{'\n'}want to learn?</Text>

          {/* Topic Pills */}
          <Animated.View style={[styles.pillsContainer, { transform: [{ scale: scaleAnim }] }]}>
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;

              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.pill,
                    isSelected && styles.pillSelected,
                  ]}
                  onPress={() => handleTopicSelect(topic)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pillIcon, { backgroundColor: `${topic.color}20` }]}>
                    <Icon size={20} color={topic.color} />
                  </View>
                  <Text style={[
                    styles.pillText,
                    isSelected && styles.pillTextSelected,
                  ]}>
                    {topic.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Custom input for "Something Else" */}
          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Type what you want to learn..."
                placeholderTextColor={COLORS.text.muted}
                value={customTopic}
                onChangeText={setCustomTopic}
                multiline
                editable={!loading}
                autoFocus
              />
            </View>
          )}

          {/* Mascot */}
          <View style={styles.mascotContainer}>
            <BrokMascot size={160} mood={selectedTopic ? 'excited' : 'happy'} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedTopic || loading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedTopic || loading}
          >
            <LinearGradient
              colors={selectedTopic && !loading
                ? [COLORS.primary, COLORS.primaryDark]
                : ['#CCCCCC', '#AAAAAA']
              }
              style={styles.continueGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.continueText}>Building your path...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.continueText}>Continue</Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <BrokMascot size={120} mood="thinking" />
          <Text style={styles.loadingTitle}>Building your path...</Text>
          <Text style={styles.loadingSubtitle}>This will just take a moment</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5EC',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 100,
  },
  cloud1: {
    width: 120,
    height: 60,
    top: 80,
    left: -30,
  },
  cloud2: {
    width: 100,
    height: 50,
    top: 150,
    right: -20,
  },
  cloud3: {
    width: 80,
    height: 40,
    bottom: 200,
    left: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: COLORS.text.primary,
    marginBottom: 32,
    lineHeight: 42,
  },
  pillsContainer: {
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pillSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pillText: {
    flex: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
  },
  pillTextSelected: {
    color: COLORS.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customInputContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  customInput: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.primary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  continueButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  continueText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
