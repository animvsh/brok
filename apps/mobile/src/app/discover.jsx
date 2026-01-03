import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  ArrowLeft,
  Music,
  Code,
  Brain,
  Dumbbell,
  Globe,
  Calculator,
  Palette,
  BookOpen,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Suggested topics
const SUGGESTED_TOPICS = [
  { id: 'guitar', label: 'Guitar', icon: Music, color: '#FF8A65' },
  { id: 'data-structures', label: 'Data Structures', icon: Code, color: '#64B5F6' },
  { id: 'psychology', label: 'Psychology', icon: Brain, color: '#BA68C8' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#4DB6AC' },
  { id: 'spanish', label: 'Spanish', icon: Globe, color: '#FFD54F' },
  { id: 'calculus', label: 'Calculus', icon: Calculator, color: '#7986CB' },
  { id: 'drawing', label: 'Drawing', icon: Palette, color: '#F06292' },
  { id: 'philosophy', label: 'Philosophy', icon: BookOpen, color: '#A1887F' },
];

// Trending topics
const TRENDING_TOPICS = [
  { id: 'ai', label: 'AI & Machine Learning', icon: TrendingUp },
  { id: 'python', label: 'Python Programming', icon: Code },
  { id: 'investing', label: 'Investing Basics', icon: TrendingUp },
];

// Recent searches (sample)
const RECENT_SEARCHES = [
  { id: 'react', label: 'React Native' },
  { id: 'chess', label: 'Chess Strategy' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const [searchQuery, setSearchQuery] = useState('');

  if (!fontsLoaded) return null;

  const handleBack = () => {
    router.back();
  };

  const handleTopicSelect = (topic) => {
    router.push({
      pathname: '/setup/intent',
      params: { topic: topic.label || topic.id },
    });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= 2) {
      router.push({
        pathname: '/setup/intent',
        params: { topic: searchQuery.trim() },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn Something New</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <Search size={20} color={COLORS.text.muted} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Learn literally anything..."
              placeholderTextColor={COLORS.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>

          {/* Mascot */}
          <View style={styles.mascotContainer}>
            <BrokMascot size={100} mood="excited" />
            <Text style={styles.mascotText}>What do you want to master?</Text>
          </View>

          {/* Suggested Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Topics</Text>
            <View style={styles.topicsGrid}>
              {SUGGESTED_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={styles.topicCard}
                    onPress={() => handleTopicSelect(topic)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.topicIcon, { backgroundColor: `${topic.color}20` }]}>
                      <Icon size={22} color={topic.color} />
                    </View>
                    <Text style={styles.topicLabel}>{topic.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Trending */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            {TRENDING_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.listItem}
                  onPress={() => handleTopicSelect(topic)}
                  activeOpacity={0.8}
                >
                  <View style={styles.listIcon}>
                    <Icon size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.listLabel}>{topic.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recent */}
          {RECENT_SEARCHES.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={18} color={COLORS.text.secondary} />
                <Text style={styles.sectionTitle}>Recent</Text>
              </View>
              {RECENT_SEARCHES.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.listItem}
                  onPress={() => handleTopicSelect(topic)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.listIcon, { backgroundColor: '#2A2A2A' }]}>
                    <Clock size={16} color={COLORS.text.muted} />
                  </View>
                  <Text style={styles.listLabel}>{topic.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  topicCard: {
    width: '47%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicLabel: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
