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
import { Sparkles, ArrowRight, Link2, FileText } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Suggestion chips
const SUGGESTIONS = [
  'Learn Python basics',
  'Data structures & algorithms',
  'Spanish for beginners',
  'Public speaking skills',
  'Personal finance 101',
  'Guitar fundamentals',
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { session, user } = useAuth();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState('text'); // text, link, or file

  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) return null;

  const handleSuggestionPress = (suggestion) => {
    setInput(suggestion);
    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      Alert.alert('What do you want to learn?', 'Type a topic, paste a link, or describe what you want to master.');
      return;
    }

    if (trimmedInput.length < 3) {
      Alert.alert('Too short', 'Please provide more detail about what you want to learn.');
      return;
    }

    setLoading(true);

    try {
      // Determine if input is a URL
      const isUrl = trimmedInput.match(/^https?:\/\//i);

      const response = await fetch(`${API_URL}/api/threads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          input: trimmedInput,
          inputType: isUrl ? 'link' : 'text',
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
        colors={['#F8FAFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Sparkles size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>What do you want to learn?</Text>
            <Text style={styles.subtitle}>
              Type anything — a topic, paste a link, or describe what you want to master
            </Text>
          </View>

          {/* Input */}
          <Animated.View style={[styles.inputCard, { transform: [{ scale: scaleAnim }] }]}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Machine learning fundamentals, or paste a PDF link..."
              placeholderTextColor={COLORS.text.muted}
              value={input}
              onChangeText={setInput}
              multiline
              textAlignVertical="top"
              editable={!loading}
              autoFocus
            />

            {/* Input type indicators */}
            <View style={styles.inputTypeRow}>
              <View style={styles.inputTypeIndicator}>
                <FileText size={14} color={COLORS.text.muted} />
                <Text style={styles.inputTypeText}>Text</Text>
              </View>
              <View style={styles.inputTypeDivider} />
              <View style={styles.inputTypeIndicator}>
                <Link2 size={14} color={COLORS.text.muted} />
                <Text style={styles.inputTypeText}>Link</Text>
              </View>
            </View>
          </Animated.View>

          {/* Suggestions */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Or try one of these:</Text>
            <View style={styles.suggestionsGrid}>
              {SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(suggestion)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit button */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!input.trim() || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!input.trim() || loading}
          >
            <LinearGradient
              colors={input.trim() && !loading
                ? [COLORS.primary, COLORS.primaryDark]
                : ['#CCCCCC', '#AAAAAA']
              }
              style={styles.submitGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitText}>Building your path...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitText}>Start Learning</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Sparkles size={48} color={COLORS.primary} />
            <Text style={styles.loadingTitle}>Building your learning path</Text>
            <Text style={styles.loadingSubtitle}>
              Analyzing your request and creating a personalized curriculum...
            </Text>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  textInput: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 17,
    color: COLORS.text.primary,
    minHeight: 100,
    lineHeight: 26,
  },
  inputTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputTypeText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.muted,
  },
  inputTypeDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  suggestionText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  submitButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitText: {
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
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
