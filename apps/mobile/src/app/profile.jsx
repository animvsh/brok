import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Flame,
  Target,
  Trophy,
  BookOpen,
  Settings,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

// Sample user stats
const USER_STATS = {
  name: 'Learner',
  email: 'user@example.com',
  joinedDate: 'Jan 2025',
  streak: 12,
  longestStreak: 30,
  totalXP: 4250,
  coursesCompleted: 2,
  coursesActive: 3,
  skillsMastered: 15,
  totalTime: '24h 30m',
};

const ACHIEVEMENTS = [
  { id: 1, name: 'First Lesson', icon: Star, earned: true },
  { id: 2, name: '7 Day Streak', icon: Flame, earned: true },
  { id: 3, name: 'Quick Learner', icon: Target, earned: true },
  { id: 4, name: 'Master', icon: Trophy, earned: false },
];

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsItem({ icon: Icon, label, onPress, showArrow = true, danger = false }) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Icon size={20} color={danger ? '#EF4444' : COLORS.text.secondary} />
      </View>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>
        {label}
      </Text>
      {showArrow && <ChevronRight size={18} color={COLORS.text.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { signOut } = useAuth();

  if (!fontsLoaded) return null;

  const handleBack = () => {
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <BrokMascot size={80} mood="happy" />
          </View>
          <Text style={styles.userName}>{USER_STATS.name}</Text>
          <Text style={styles.userEmail}>{USER_STATS.email}</Text>
          <Text style={styles.joinedText}>Learning since {USER_STATS.joinedDate}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon={Flame} value={USER_STATS.streak} label="Day Streak" color="#FF6B35" />
          <StatCard icon={Target} value={USER_STATS.totalXP} label="Total XP" color="#10B981" />
          <StatCard icon={BookOpen} value={USER_STATS.skillsMastered} label="Skills" color="#6366F1" />
          <StatCard icon={Trophy} value={USER_STATS.coursesCompleted} label="Completed" color="#F59E0B" />
        </View>

        {/* Learning Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Journey</Text>
          <View style={styles.journeyCard}>
            <View style={styles.journeyRow}>
              <Text style={styles.journeyLabel}>Total Learning Time</Text>
              <Text style={styles.journeyValue}>{USER_STATS.totalTime}</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyRow}>
              <Text style={styles.journeyLabel}>Active Courses</Text>
              <Text style={styles.journeyValue}>{USER_STATS.coursesActive}</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyRow}>
              <Text style={styles.journeyLabel}>Longest Streak</Text>
              <Text style={styles.journeyValue}>{USER_STATS.longestStreak} days</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsRow}>
            {ACHIEVEMENTS.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementBadge,
                    !achievement.earned && styles.achievementLocked,
                  ]}
                >
                  <Icon
                    size={24}
                    color={achievement.earned ? '#F59E0B' : '#D1D5DB'}
                    fill={achievement.earned ? '#F59E0B' : 'transparent'}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingsItem
              icon={User}
              label="Edit Profile"
              onPress={() => {}}
            />
            <SettingsItem
              icon={Bell}
              label="Notifications"
              onPress={() => {}}
            />
            <SettingsItem
              icon={Target}
              label="Daily Goals"
              onPress={() => {}}
            />
            <SettingsItem
              icon={Moon}
              label="Appearance"
              onPress={() => {}}
            />
            <SettingsItem
              icon={HelpCircle}
              label="Help & Support"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <SettingsItem
              icon={LogOut}
              label="Sign Out"
              onPress={handleSignOut}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>brok v2.0.0</Text>
      </ScrollView>
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
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  userEmail: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  joinedText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  journeyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  journeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  journeyLabel: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  journeyValue: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  journeyDivider: {
    height: 1,
    backgroundColor: '#333333',
  },
  achievementsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2A2A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A2A',
  },
  achievementLocked: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
  },
  settingsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  settingsLabel: {
    flex: 1,
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  settingsLabelDanger: {
    color: '#EF4444',
  },
  versionText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
