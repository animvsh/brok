import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Lock,
  Star,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useAppFonts } from '@/components/useFonts';
import { COLORS } from '@/components/theme/colors';
import BrokMascot from '@/components/mascot/BrokMascot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sample skill graph data
const SAMPLE_GRAPH = {
  nodes: [
    { id: 1, name: 'Arrays', x: 0.5, y: 0.15, mastery: 0.9, status: 'mastered' },
    { id: 2, name: 'Linked Lists', x: 0.3, y: 0.35, mastery: 0.65, status: 'learning' },
    { id: 3, name: 'Hash Tables', x: 0.7, y: 0.35, mastery: 0.45, status: 'learning' },
    { id: 4, name: 'Stacks', x: 0.2, y: 0.55, mastery: 0.2, status: 'started' },
    { id: 5, name: 'Queues', x: 0.5, y: 0.55, mastery: 0, status: 'locked' },
    { id: 6, name: 'Trees', x: 0.8, y: 0.55, mastery: 0, status: 'locked' },
    { id: 7, name: 'Graphs', x: 0.35, y: 0.75, mastery: 0, status: 'locked' },
    { id: 8, name: 'Heaps', x: 0.65, y: 0.75, mastery: 0, status: 'locked' },
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 5 },
    { from: 3, to: 6 },
    { from: 4, to: 7 },
    { from: 5, to: 7 },
    { from: 5, to: 8 },
    { from: 6, to: 8 },
  ],
};

function getNodeColor(status, mastery) {
  if (status === 'mastered') return '#10B981';
  if (status === 'learning') return '#6366F1';
  if (status === 'started') return '#F59E0B';
  return '#6B7280';
}

function getNodeGlow(status) {
  if (status === 'mastered') return '#10B98180';
  if (status === 'learning') return '#6366F180';
  if (status === 'started') return '#F59E0B80';
  return 'transparent';
}

export default function SkillGraphScreen() {
  const insets = useSafeAreaInsets();
  const { fontsLoaded } = useAppFonts();
  const { courseId } = useLocalSearchParams();
  const [selectedNode, setSelectedNode] = useState(null);

  if (!fontsLoaded) return null;

  const graph = SAMPLE_GRAPH;
  const graphWidth = SCREEN_WIDTH - 40;
  const graphHeight = SCREEN_HEIGHT * 0.55;

  const handleBack = () => {
    router.back();
  };

  const handleNodePress = (node) => {
    if (node.status !== 'locked') {
      setSelectedNode(node);
    }
  };

  const handlePractice = () => {
    setSelectedNode(null);
    router.push({
      pathname: '/lesson',
      params: { courseId, skillId: selectedNode.id },
    });
  };

  const handleReview = () => {
    setSelectedNode(null);
    router.push({
      pathname: '/lesson',
      params: { courseId, skillId: selectedNode.id, mode: 'review' },
    });
  };

  // Calculate node positions
  const getNodePosition = (node) => ({
    x: node.x * graphWidth,
    y: node.y * graphHeight,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Dark gradient background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Starry background decoration */}
      <View style={styles.starsContainer}>
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
              },
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skill Map</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Mastered</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendText}>Learning</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Started</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.legendText}>Locked</Text>
        </View>
      </View>

      {/* Skill Graph */}
      <View style={styles.graphContainer}>
        <Svg width={graphWidth} height={graphHeight}>
          <Defs>
            {graph.nodes.map((node) => (
              <RadialGradient key={`grad-${node.id}`} id={`glow-${node.id}`}>
                <Stop offset="0%" stopColor={getNodeGlow(node.status)} />
                <Stop offset="100%" stopColor="transparent" />
              </RadialGradient>
            ))}
          </Defs>

          {/* Edges */}
          {graph.edges.map((edge, index) => {
            const fromNode = graph.nodes.find((n) => n.id === edge.from);
            const toNode = graph.nodes.find((n) => n.id === edge.to);
            const from = getNodePosition(fromNode);
            const to = getNodePosition(toNode);
            const isActive = fromNode.status !== 'locked' && toNode.status !== 'locked';

            return (
              <Line
                key={index}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isActive ? '#6366F140' : '#6B728040'}
                strokeWidth={2}
                strokeDasharray={isActive ? undefined : '4,4'}
              />
            );
          })}

          {/* Node glows */}
          {graph.nodes.map((node) => {
            const pos = getNodePosition(node);
            if (node.status === 'locked') return null;
            return (
              <Circle
                key={`glow-circle-${node.id}`}
                cx={pos.x}
                cy={pos.y}
                r={35}
                fill={`url(#glow-${node.id})`}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const pos = getNodePosition(node);
            return (
              <Circle
                key={`node-${node.id}`}
                cx={pos.x}
                cy={pos.y}
                r={node.status === 'mastered' ? 18 : 15}
                fill={getNodeColor(node.status, node.mastery)}
                stroke={node.status === 'mastered' ? '#FFFFFF' : 'transparent'}
                strokeWidth={2}
                onPress={() => handleNodePress(node)}
              />
            );
          })}
        </Svg>

        {/* Node Labels */}
        {graph.nodes.map((node) => {
          const pos = getNodePosition(node);
          return (
            <TouchableOpacity
              key={`label-${node.id}`}
              style={[
                styles.nodeLabel,
                {
                  left: pos.x - 50,
                  top: pos.y + 22,
                },
              ]}
              onPress={() => handleNodePress(node)}
              disabled={node.status === 'locked'}
            >
              <Text
                style={[
                  styles.nodeLabelText,
                  node.status === 'locked' && styles.nodeLabelLocked,
                ]}
              >
                {node.name}
              </Text>
              {node.status !== 'locked' && (
                <Text style={styles.nodeMastery}>
                  {Math.round(node.mastery * 100)}%
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <BrokMascot size={80} mood="encouraging" />
        <Text style={styles.mascotText}>Tap a skill to practice!</Text>
      </View>

      {/* Node Detail Modal */}
      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedNode(null)}
            >
              <X size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>

            {selectedNode && (
              <>
                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: `${getNodeColor(selectedNode.status)}20` },
                  ]}
                >
                  {selectedNode.status === 'mastered' ? (
                    <Star size={28} color={getNodeColor(selectedNode.status)} fill={getNodeColor(selectedNode.status)} />
                  ) : (
                    <Sparkles size={28} color={getNodeColor(selectedNode.status)} />
                  )}
                </View>

                <Text style={styles.modalTitle}>{selectedNode.name}</Text>
                <Text style={styles.modalMastery}>
                  {Math.round(selectedNode.mastery * 100)}% Mastery
                </Text>

                {/* Progress bar */}
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      {
                        width: `${selectedNode.mastery * 100}%`,
                        backgroundColor: getNodeColor(selectedNode.status),
                      },
                    ]}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handlePractice}
                  >
                    <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.modalButtonTextPrimary}>Practice</Text>
                  </TouchableOpacity>

                  {selectedNode.mastery > 0 && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleReview}
                    >
                      <RotateCcw size={18} color={COLORS.primary} />
                      <Text style={styles.modalButtonText}>Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  graphContainer: {
    flex: 1,
    marginHorizontal: 20,
    position: 'relative',
  },
  nodeLabel: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  nodeLabelText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nodeLabelLocked: {
    color: 'rgba(255,255,255,0.4)',
  },
  nodeMastery: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  mascotContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  mascotText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  modalMastery: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  modalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    backgroundColor: `${COLORS.primary}15`,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: COLORS.primary,
  },
  modalButtonTextPrimary: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
