import React, { useEffect } from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user, isReady, isAuthenticated } = useAuth();

  // Check if user has an active learning thread
  const { data, isLoading } = useQuery({
    queryKey: ['activeThread', user?.id],
    queryFn: async () => {
      if (!user?.id) return { hasThread: false };

      const { data: threads } = await supabase
        .from('learning_threads')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      return { hasThread: threads && threads.length > 0, threadId: threads?.[0]?.id };
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    // Auto-navigate after a short delay
    const timer = setTimeout(() => {
      if (data?.hasThread) {
        // Returning user - go to Today's Path
        router.replace({ pathname: '/home', params: { threadId: data.threadId } });
      } else {
        // First-time user - go to onboarding
        router.replace('/onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isReady, fontsLoaded, data]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F0F1A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Sparkles size={40} color="#1A1A2E" />
          </View>
        </View>

        {/* Brand name */}
        <Text style={styles.brandName}>BROK</Text>
        <Text style={styles.tagline}>learn anything</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
  },
});
