import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  Map,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  Lock,
  Check,
  Star,
  Play,
} from "lucide-react-native";
import { useAppFonts } from "@/components/useFonts";
import { useAuth } from "@/utils/auth";
import { supabase } from "@/utils/auth/supabase";
import GradientBackground from "@/components/ui/GradientBackground";
import BrokMascot from "@/components/mascot/BrokMascot";
import FloatingClouds from "@/components/ui/FloatingClouds";
import { StatsRow } from "@/components/ui/XPBadge";
import { COLORS, GRADIENTS } from "@/components/theme/colors";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { user, session } = useAuth();

  // Fetch user's learning threads
  const { data: threadsData, isLoading } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: async () => {
      if (!user?.id) return { threads: [], stats: null };

      const { data: threads, error: threadsError } = await supabase
        .from("learning_threads")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (threadsError) {
        console.error("Threads fetch error:", threadsError);
      }

      const { data: stats } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return { threads: threads || [], stats };
    },
    enabled: !!user?.id,
  });

  const activeThread = threadsData?.threads?.[0];

  const { data: masteryData } = useQuery({
    queryKey: ["masterySummary", activeThread?.id],
    queryFn: async () => {
      if (!activeThread?.id || !session?.access_token) return null;

      const response = await fetch(
        `${API_URL}/api/graphs/visualize?threadId=${activeThread.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!activeThread?.id && !!session?.access_token,
  });

  if (!fontsLoaded) return null;

  const stats = threadsData?.stats || {
    total_xp: 0,
    current_streak: 0,
    skills_mastered: 0,
  };

  const threads = threadsData?.threads || [];
  const summary = masteryData?.summary || {};
  const nodes = masteryData?.nodes || [];

  // Calculate level from XP (every 500 XP = 1 level)
  const level = Math.floor((stats.total_xp || 0) / 500) + 1;

  const handleContinue = () => {
    if (activeThread) {
      router.push({ pathname: "/action", params: { threadId: activeThread.id } });
    }
  };

  const handleViewSkillMap = () => {
    if (activeThread) {
      router.push({ pathname: "/skillmap", params: { threadId: activeThread.id } });
    }
  };

  const handleCreateNew = () => {
    router.push("/create");
  };

  const handleNodePress = (node, isUnlocked) => {
    if (isUnlocked && activeThread) {
      router.push({ pathname: "/action", params: { threadId: activeThread.id, nodeId: node.id } });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <GradientBackground variant="softBlue">
        <View style={[styles.centered, { flex: 1 }]}>
          <BrokMascot size={100} mood="thinking" />
          <Text style={styles.loadingText}>Loading your journey...</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        </View>
      </GradientBackground>
    );
  }

  // Empty state - no threads
  if (threads.length === 0) {
    return (
      <GradientBackground variant="warmSunset">
        <StatusBar barStyle="dark-content" />
        <FloatingClouds variant="bottom" />
        <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom }]}>
          <View style={styles.centered}>
            <BrokMascot size={180} mood="encouraging" />

            <Text style={styles.emptyTitle}>Hey there!</Text>
            <Text style={styles.emptySubtitle}>
              Ready to start your learning adventure?{"\n"}
              Let's master something amazing together!
            </Text>

            <TouchableOpacity onPress={handleCreateNew} style={styles.startButton}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButtonGradient}
              >
                <Sparkles size={22} color="white" />
                <Text style={styles.startButtonText}>Start Learning</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // Generate lesson path nodes based on skill graph
  const lessonPath = nodes.length > 0
    ? nodes.slice(0, 8).map((node, index) => ({
        id: node.id,
        name: node.name,
        mastery: node.mastery_p || 0,
        isMastered: node.mastery_p >= 0.9,
        isLocked: index > 0 && nodes[index - 1]?.mastery_p < 0.7,
        isCurrent: !node.mastery_p || node.mastery_p < 0.9,
      }))
    : [
        { id: 1, name: "Basics", mastery: 1, isMastered: true },
        { id: 2, name: "Fundamentals", mastery: 0.75, isCurrent: true },
        { id: 3, name: "Practice", mastery: 0, isLocked: true },
        { id: 4, name: "Advanced", mastery: 0, isLocked: true },
        { id: 5, name: "Mastery", mastery: 0, isLocked: true },
      ];

  // Find current (in-progress) node
  const currentNodeIndex = lessonPath.findIndex(n => n.isCurrent && !n.isLocked);

  // Main home view with vertical lesson path
  return (
    <GradientBackground variant="softBlue" showBubbles={false}>
      <StatusBar barStyle="dark-content" />
      <FloatingClouds variant="scattered" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Stats */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.threadTitle}>{activeThread?.title || "Your Journey"}</Text>
          </View>
          <StatsRow xp={stats.total_xp} streak={stats.current_streak} level={level} />
        </View>

        {/* Lesson Path Title */}
        <View style={styles.pathHeader}>
          <View style={styles.pathBadge}>
            <Star size={14} color={COLORS.xp.gold} />
            <Text style={styles.pathBadgeText}>LEARNING PATH</Text>
          </View>
          <TouchableOpacity onPress={handleViewSkillMap} style={styles.mapButton}>
            <Map size={18} color={COLORS.primary} />
            <Text style={styles.mapButtonText}>Full Map</Text>
          </TouchableOpacity>
        </View>

        {/* Vertical Lesson Path */}
        <View style={styles.lessonPath}>
          {lessonPath.map((node, index) => {
            const isUnlocked = !node.isLocked;
            const isCurrent = currentNodeIndex === index;
            const isMastered = node.isMastered;

            // Alternate left/right positioning for curved path effect
            const isLeft = index % 2 === 0;

            return (
              <View key={node.id} style={styles.pathNodeContainer}>
                {/* Connecting line */}
                {index < lessonPath.length - 1 && (
                  <View
                    style={[
                      styles.pathLine,
                      isLeft ? styles.pathLineLeft : styles.pathLineRight,
                      node.isMastered && styles.pathLineCompleted,
                    ]}
                  />
                )}

                {/* Node */}
                <TouchableOpacity
                  onPress={() => handleNodePress(node, isUnlocked)}
                  disabled={!isUnlocked}
                  style={[
                    styles.pathNode,
                    isLeft ? styles.pathNodeLeft : styles.pathNodeRight,
                    isMastered && styles.pathNodeMastered,
                    isCurrent && styles.pathNodeCurrent,
                    node.isLocked && styles.pathNodeLocked,
                  ]}
                >
                  <View style={[
                    styles.nodeCircle,
                    isMastered && styles.nodeCircleMastered,
                    isCurrent && styles.nodeCircleCurrent,
                    node.isLocked && styles.nodeCircleLocked,
                  ]}>
                    {isMastered ? (
                      <Check size={24} color="white" strokeWidth={3} />
                    ) : node.isLocked ? (
                      <Lock size={20} color={COLORS.text.muted} />
                    ) : isCurrent ? (
                      <Play size={20} color="white" fill="white" />
                    ) : (
                      <Star size={20} color={COLORS.xp.gold} />
                    )}
                  </View>
                  <View style={styles.nodeInfo}>
                    <Text style={[
                      styles.nodeName,
                      node.isLocked && styles.nodeNameLocked,
                    ]}>
                      {node.name}
                    </Text>
                    {!node.isLocked && (
                      <View style={styles.nodeProgress}>
                        <View style={styles.nodeProgressBar}>
                          <View
                            style={[
                              styles.nodeProgressFill,
                              { width: `${Math.round(node.mastery * 100)}%` },
                              isMastered && styles.nodeProgressFillMastered,
                            ]}
                          />
                        </View>
                        <Text style={styles.nodeProgressText}>
                          {Math.round(node.mastery * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Current node mascot */}
                {isCurrent && (
                  <View style={[
                    styles.currentMascot,
                    isLeft ? styles.currentMascotRight : styles.currentMascotLeft,
                  ]}>
                    <BrokMascot size={60} mood="encouraging" />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <Zap size={22} color="white" />
            <Text style={styles.continueText}>Continue Learning</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={handleCreateNew} style={styles.actionCard}>
            <LinearGradient
              colors={[COLORS.accent.purple, '#9B59B6']}
              style={styles.actionIconContainer}
            >
              <Plus size={24} color="white" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>New Path</Text>
              <Text style={styles.actionSubtitle}>Start something new</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Other Learning Paths */}
        {threads.length > 1 && (
          <View style={styles.otherPaths}>
            <Text style={styles.sectionTitle}>Other Paths</Text>
            {threads.slice(1, 4).map((thread) => (
              <TouchableOpacity
                key={thread.id}
                onPress={() => router.push({ pathname: "/action", params: { threadId: thread.id } })}
                style={styles.threadCard}
              >
                <View style={styles.threadIcon}>
                  <Zap size={18} color={COLORS.accent.orange} />
                </View>
                <Text style={styles.threadName} numberOfLines={1}>{thread.title}</Text>
                <ChevronRight size={18} color={COLORS.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: COLORS.text.primary,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: COLORS.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: "Urbanist_500Medium",
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 36,
    gap: 10,
  },
  startButtonText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: "white",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: {
    fontFamily: "Urbanist_500Medium",
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  threadTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: COLORS.text.primary,
    marginTop: 4,
  },

  // Path Header
  pathHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pathBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.xp.gold}20`,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  pathBadgeText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    color: COLORS.xp.gold,
    letterSpacing: 0.5,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapButtonText: {
    fontFamily: "Urbanist_600SemiBold",
    fontSize: 14,
    color: COLORS.primary,
  },

  // Lesson Path
  lessonPath: {
    paddingVertical: 10,
  },
  pathNodeContainer: {
    position: "relative",
    marginBottom: 16,
    minHeight: 80,
  },
  pathLine: {
    position: "absolute",
    width: 3,
    height: 60,
    backgroundColor: "#E0E0E0",
    top: 50,
    borderRadius: 2,
  },
  pathLineLeft: {
    left: 60,
  },
  pathLineRight: {
    right: 60,
  },
  pathLineCompleted: {
    backgroundColor: COLORS.status.success,
  },
  pathNode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: width * 0.75,
  },
  pathNodeLeft: {
    alignSelf: "flex-start",
  },
  pathNodeRight: {
    alignSelf: "flex-end",
  },
  pathNodeMastered: {
    borderWidth: 2,
    borderColor: COLORS.status.success,
  },
  pathNodeCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  pathNodeLocked: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  nodeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  nodeCircleMastered: {
    backgroundColor: COLORS.status.success,
  },
  nodeCircleCurrent: {
    backgroundColor: COLORS.primary,
  },
  nodeCircleLocked: {
    backgroundColor: "#E0E0E0",
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  nodeNameLocked: {
    color: COLORS.text.muted,
  },
  nodeProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 3,
    overflow: "hidden",
  },
  nodeProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  nodeProgressFillMastered: {
    backgroundColor: COLORS.status.success,
  },
  nodeProgressText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: COLORS.text.secondary,
    width: 36,
    textAlign: "right",
  },
  currentMascot: {
    position: "absolute",
    top: 0,
  },
  currentMascotRight: {
    left: -10,
  },
  currentMascotLeft: {
    right: -10,
  },

  // Continue Button
  continueButton: {
    borderRadius: 50,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  continueText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 17,
    color: "white",
  },

  // Quick Actions
  quickActions: {
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: COLORS.text.primary,
  },
  actionSubtitle: {
    fontFamily: "Urbanist_400Regular",
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Other Paths
  otherPaths: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  threadIcon: {
    width: 40,
    height: 40,
    backgroundColor: `${COLORS.accent.orange}20`,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  threadName: {
    flex: 1,
    fontFamily: "Urbanist_600SemiBold",
    fontSize: 15,
    color: COLORS.text.primary,
  },
});
