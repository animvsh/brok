import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flame,
  Star,
  Play,
  Check,
  Lock,
  BookOpen,
  Brain,
  Repeat,
  Zap,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';
import { supabase } from '@/utils/auth/supabase';
import { COLORS } from '@/components/theme/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Node types with icons
const NODE_TYPES = {
  learn: { icon: BookOpen, color: COLORS.primary, label: 'Learn' },
  practice: { icon: Brain, color: '#9C27B0', label: 'Practice' },
  reinforce: { icon: Repeat, color: '#FF9800', label: 'Reinforce' },
  check: { icon: Zap, color: '#4CAF50', label: 'Quick Check' },
};

// Sample path nodes (in real app, fetched from API based on mastery)
const SAMPLE_PATH = [
  { id: 1, type: 'learn', title: 'Arrays Basics', status: 'current', time: '3 min' },
  { id: 2, type: 'practice', title: 'Array Operations', status: 'locked', time: '4 min' },
  { id: 3, type: 'check', title: 'Quick Quiz', status: 'locked', time: '2 min' },
  { id: 4, type: 'learn', title: 'Linked Lists', status: 'locked', time: '5 min' },
  { id: 5, type: 'reinforce', title: 'Review Session', status: 'locked', time: '3 min' },
];

function PathNode({ node, index, onPress }) {
  const nodeType = NODE_TYPES[node.type] || NODE_TYPES.learn;
  const Icon = nodeType.icon;
  const isCurrent = node.status === 'current';
  const isComplete = node.status === 'complete';
  const isLocked = node.status === 'locked';

  return (
    <TouchableOpacity
      style={[
        styles.nodeContainer,
        isCurrent && styles.nodeContainerCurrent,
        isLocked && styles.nodeContainerLocked,
      ]}
      onPress={() => !isLocked && onPress(node)}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      {/* Connector line */}
      {index > 0 && (
        <View style={[
          styles.connector,
          isComplete && styles.connectorComplete,
        ]} />
      )}

      {/* Node circle */}
      <View style={[
        styles.nodeCircle,
        { backgroundColor: isLocked ? '#E0E0E0' : nodeType.color },
        isCurrent && styles.nodeCircleCurrent,
      ]}>
        {isComplete ? (
          <Check size={20} color="#FFFFFF" strokeWidth={3} />
        ) : isLocked ? (
          <Lock size={18} color="#9E9E9E" />
        ) : (
          <Icon size={20} color="#FFFFFF" />
        )}
      </View>

      {/* Node content */}
      <View style={styles.nodeContent}>
        <Text style={[
          styles.nodeTitle,
          isLocked && styles.nodeTitleLocked,
        ]}>
          {node.title}
        </Text>
        <View style={styles.nodeMetaRow}>
          <Text style={styles.nodeType}>{nodeType.label}</Text>
          <Text style={styles.nodeDot}>·</Text>
          <Text style={styles.nodeTime}>{node.time}</Text>
        </View>
      </View>

      {/* Play button for current */}
      {isCurrent && (
        <View style={styles.playButton}>
          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user, session } = useAuth();
  const { threadId } = useLocalSearchParams();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data || { total_xp: 0, current_streak: 0 };
    },
    enabled: !!user?.id,
  });

  // Fetch today's path
  const { data: pathData, isLoading } = useQuery({
    queryKey: ['todaysPath', threadId],
    queryFn: async () => {
      if (!threadId || !session?.access_token) return { nodes: SAMPLE_PATH };

      try {
        const response = await fetch(
          `${API_URL}/api/threads/${threadId}/next`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          return { nodes: data.pathNodes || SAMPLE_PATH };
        }
      } catch (e) {
        console.error('Error fetching path:', e);
      }
      return { nodes: SAMPLE_PATH };
    },
    enabled: !!user?.id,
  });

  if (!fontsLoaded) return null;

  const xp = stats?.total_xp || 0;
  const streak = stats?.current_streak || 0;
  const pathNodes = pathData?.nodes || SAMPLE_PATH;
  const totalTime = pathNodes.reduce((acc, n) => acc + parseInt(n.time), 0);

  const handleNodePress = (node) => {
    router.push({
      pathname: '/lesson',
      params: { threadId, nodeId: node.id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Today's Path</Text>
          <Text style={styles.timeEstimate}>{totalTime} min total</Text>
        </View>

        <View style={styles.statsRow}>
          {/* Streak */}
          <View style={styles.statBadge}>
            <Flame size={16} color={COLORS.streak.fire} />
            <Text style={styles.statValue}>{streak}</Text>
          </View>

          {/* XP */}
          <View style={[styles.statBadge, styles.statBadgeXP]}>
            <Star size={16} color={COLORS.xp.gold} />
            <Text style={styles.statValue}>{xp}</Text>
          </View>
        </View>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Path nodes */}
          {pathNodes.map((node, index) => (
            <PathNode
              key={node.id}
              node={node}
              index={index}
              onPress={handleNodePress}
            />
          ))}
        </ScrollView>
      )}

      {/* Start button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            const currentNode = pathNodes.find(n => n.status === 'current');
            if (currentNode) handleNodePress(currentNode);
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.startGradient}
          >
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startText}>Start Learning</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: COLORS.text.primary,
  },
  timeEstimate: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statBadgeXP: {
    backgroundColor: `${COLORS.xp.gold}15`,
    borderColor: `${COLORS.xp.gold}30`,
  },
  statValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  nodeContainerCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeContainerLocked: {
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  connector: {
    position: 'absolute',
    left: 35,
    top: -12,
    width: 2,
    height: 12,
    backgroundColor: '#E0E0E0',
  },
  connectorComplete: {
    backgroundColor: COLORS.status.success,
  },
  nodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  nodeCircleCurrent: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeContent: {
    flex: 1,
  },
  nodeTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  nodeTitleLocked: {
    color: COLORS.text.muted,
  },
  nodeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeType: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  nodeDot: {
    color: COLORS.text.muted,
    marginHorizontal: 6,
  },
  nodeTime: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    color: COLORS.text.muted,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  startButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
