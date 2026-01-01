import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) return null;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

      if (error) {
        Alert.alert('Error', error.message || 'Authentication failed');
      } else {
        router.replace('/');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mascot */}
          <View style={styles.mascotContainer}>
            <BrokMascot size={120} mood="happy" />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back!' : 'Join Brok!'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Sign in to continue learning' : 'Create an account to start'}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.text.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.text.muted} />
                ) : (
                  <Eye size={20} color={COLORS.text.muted} />
                )}
              </TouchableOpacity>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Toggle mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode} disabled={loading}>
              <Text style={styles.toggleLink}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    width: 140,
    height: 60,
    top: 60,
    right: -40,
  },
  cloud2: {
    width: 100,
    height: 45,
    top: 140,
    left: -30,
  },
  cloud3: {
    width: 80,
    height: 35,
    bottom: 150,
    right: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.primary,
    paddingVertical: 18,
  },
  eyeButton: {
    padding: 8,
  },
  submitButton: {
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  toggleText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  toggleLink: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
});
