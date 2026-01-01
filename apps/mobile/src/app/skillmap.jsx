import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Lock, CheckCircle, Circle } from 'lucide-react-native';
import Svg, { Line, Circle as SvgCircle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/components/useTheme';
import { useAppFonts } from '@/components/useFonts';
import { useAuth } from '@/utils/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors for mastery bands
const MASTERY_COLORS = {
  novice: '#6B7280',
  developing: '#F59E0B',
  proficient: '#3B82F6',
  mastered: '#10B981',
  locked: '#374151',
};

// Star glow colors
const GLOW_COLORS = {
  novice: 'rgba(107, 114, 128, 0.3)',
  developing: 'rgba(245, 158, 11, 0.4)',
  proficient: 'rgba(59, 130, 246, 0.4)',
  mastered: 'rgba(16, 185, 129, 0.5)',
  locked: 'rgba(55, 65, 81, 0.2)',
};

// Skill Node Component (rendered as star)
function SkillNode({ node, onPress, scale = 1 }) {
  const mastery = node.mastery || {};
  const band = mastery.band || 'novice';
  const isLocked = mastery.isLocked;
  const isMastered = mastery.isMastered;
  const color = isLocked ? MASTERY_COLORS.locked : MASTERY_COLORS[band];
  const glowColor = isLocked ? GLOW_COLORS.locked : GLOW_COLORS[band];

  // Calculate node size based on mastery
  const baseSize = 20 * scale;
  const size = baseSize + (mastery.p || 0) * 10 * scale;

  return (
    <G>
      {/* Glow effect */}
      <SvgCircle
        cx={node.position.x * scale}
        cy={node.position.y * scale}
        r={size + 8}
        fill={glowColor}
      />
      {/* Main star */}
      <SvgCircle
        cx={node.position.x * scale}
        cy={node.position.y * scale}
        r={size}
        fill={color}
        onPress={() => onPress(node)}
      />
      {/* Inner highlight */}
      <SvgCircle
        cx={node.position.x * scale}
        cy={node.position.y * scale}
        r={size * 0.6}
        fill={isLocked ? '#4B5563' : isMastered ? '#34D399' : '#FFFFFF'}
        opacity={0.3}
      />
    </G>
  );
}

// Edge Component
function Edge({ edge, scale = 1 }) {
  const fromX = edge.fromPosition.x * scale;
  const fromY = edge.fromPosition.y * scale;
  const toX = edge.toPosition.x * scale;
  const toY = edge.toPosition.y * scale;

  return (
    <Line
      x1={fromX}
      y1={fromY}
      x2={toX}
      y2={toY}
      stroke={edge.isComplete ? '#10B981' : '#374151'}
      strokeWidth={edge.isComplete ? 2 : 1}
      strokeOpacity={edge.isComplete ? 0.8 : 0.3}
      strokeDasharray={edge.isComplete ? undefined : '4,4'}
    />
  );
}

// Node Detail Panel
function NodeDetailPanel({ node, onClose, onStartLearning }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!node) return null;

  const mastery = node.mastery || {};
  const band = mastery.band || 'novice';
  const color = mastery.isLocked ? MASTERY_COLORS.locked : MASTERY_COLORS[band];

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1F2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: insets.bottom + 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {mastery.isLocked ? (
              <Lock size={16} color="#6B7280" />
            ) : mastery.isMastered ? (
              <CheckCircle size={16} color="#10B981" />
            ) : (
              <Circle size={16} color={color} />
            )}
            <Text
              style={{
                fontFamily: 'Montserrat_600SemiBold',
                fontSize: 12,
                color: color,
                textTransform: 'uppercase',
              }}
            >
              {mastery.isLocked ? 'Locked' : band}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Urbanist_700Bold',
              fontSize: 20,
              color: '#FFFFFF',
            }}
          >
            {node.name}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Text
            style={{
              fontFamily: 'Urbanist_500Medium',
              fontSize: 14,
              color: '#9CA3AF',
            }}
          >
            Close
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {node.description && (
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 14,
            color: '#9CA3AF',
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {node.description}
        </Text>
      )}

      {/* Mastery Stats */}
      {!mastery.isLocked && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#111827',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            gap: 20,
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 24,
                color: '#FFFFFF',
              }}
            >
              {Math.round((mastery.p || 0) * 100)}%
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              Mastery
            </Text>
          </View>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 24,
                color: '#FFFFFF',
              }}
            >
              {mastery.confirmationCount || 0}/3
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              Confirmations
            </Text>
          </View>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Montserrat_700Bold',
                fontSize: 24,
                color: '#FFFFFF',
              }}
            >
              {mastery.evidenceCount || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              Activities
            </Text>
          </View>
        </View>
      )}

      {/* Blockers */}
      {mastery.blockers && mastery.blockers.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 8,
            }}
          >
            TO MASTER
          </Text>
          {mastery.blockers.map((blocker, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#F59E0B',
                }}
              />
              <Text
                style={{
                  fontFamily: 'Urbanist_400Regular',
                  fontSize: 13,
                  color: '#D1D5DB',
                }}
              >
                {blocker}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Button */}
      {!mastery.isLocked && !mastery.isMastered && (
        <TouchableOpacity
          onPress={() => onStartLearning(node)}
          style={{
            backgroundColor: color,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 16,
              color: '#FFFFFF',
            }}
          >
            Practice This Skill
          </Text>
        </TouchableOpacity>
      )}

      {mastery.isMastered && (
        <View
          style={{
            backgroundColor: '#064E3B',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={20} color="#10B981" />
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 16,
              color: '#10B981',
            }}
          >
            Mastered!
          </Text>
        </View>
      )}

      {mastery.isLocked && (
        <View
          style={{
            backgroundColor: '#1F2937',
            borderWidth: 1,
            borderColor: '#374151',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Lock size={20} color="#6B7280" />
          <Text
            style={{
              fontFamily: 'Montserrat_600SemiBold',
              fontSize: 16,
              color: '#6B7280',
            }}
          >
            Complete prerequisites first
          </Text>
        </View>
      )}
    </View>
  );
}

export default function SkillMapScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { fontsLoaded } = useAppFonts();
  const { session } = useAuth();
  const { threadId } = useLocalSearchParams();

  const [selectedNode, setSelectedNode] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 400, height: 600 });

  // Fetch graph data
  const { data, isLoading, error } = useQuery({
    queryKey: ['graphVisualize', threadId],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${API_URL}/api/graphs/visualize?threadId=${threadId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch graph');
      }

      return response.json();
    },
    enabled: !!threadId && !!session?.access_token,
  });

  const handleBack = () => {
    router.back();
  };

  const handleNodePress = (node) => {
    setSelectedNode(node);
  };

  const handleStartLearning = (node) => {
    setSelectedNode(null);
    router.push({ pathname: '/action', params: { threadId } });
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text
          style={{
            marginTop: 16,
            fontFamily: 'Urbanist_400Regular',
            fontSize: 14,
            color: '#9CA3AF',
          }}
        >
          Loading skill constellation...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Text
          style={{
            fontFamily: 'Montserrat_600SemiBold',
            fontSize: 18,
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Error loading map
        </Text>
        <Text
          style={{
            fontFamily: 'Urbanist_400Regular',
            fontSize: 14,
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          {error.message}
        </Text>
      </View>
    );
  }

  const { nodes = [], edges = [], layout = {}, summary = {}, thread = {} } = data || {};

  // Calculate scale and offset for centering
  const padding = 60;
  const svgWidth = SCREEN_WIDTH;
  const svgHeight = SCREEN_HEIGHT - 200;

  const graphWidth = layout.width || 400;
  const graphHeight = layout.height || 400;

  const scaleX = (svgWidth - padding * 2) / graphWidth;
  const scaleY = (svgHeight - padding * 2) / graphHeight;
  const scale = Math.min(scaleX, scaleY, 1.5);

  const offsetX = (svgWidth - graphWidth * scale) / 2 - (layout.bounds?.minX || 0) * scale;
  const offsetY = (svgHeight - graphHeight * scale) / 2 - (layout.bounds?.minY || 0) * scale;

  // Transform nodes for rendering
  const transformedNodes = nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x * scale + offsetX,
      y: node.position.y * scale + offsetY,
    },
  }));

  const transformedEdges = edges.map((edge) => ({
    ...edge,
    fromPosition: {
      x: edge.fromPosition.x * scale + offsetX,
      y: edge.fromPosition.y * scale + offsetY,
    },
    toPosition: {
      x: edge.toPosition.x * scale + offsetX,
      y: edge.toPosition.y * scale + offsetY,
    },
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: insets.top,
      }}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 44,
            height: 44,
            backgroundColor: '#1F2937',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Montserrat_700Bold',
              fontSize: 18,
              color: '#FFFFFF',
            }}
            numberOfLines={1}
          >
            {thread.title || 'Skill Map'}
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist_400Regular',
              fontSize: 12,
              color: '#9CA3AF',
            }}
          >
            {summary.masteredNodes}/{summary.totalNodes} skills mastered
          </Text>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: MASTERY_COLORS.mastered,
              }}
            />
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 10,
                color: '#6B7280',
                marginTop: 2,
              }}
            >
              {summary.masteredNodes}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: MASTERY_COLORS.developing,
              }}
            />
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 10,
                color: '#6B7280',
                marginTop: 2,
              }}
            >
              {summary.inProgressNodes}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: MASTERY_COLORS.locked,
              }}
            />
            <Text
              style={{
                fontFamily: 'Urbanist_400Regular',
                fontSize: 10,
                color: '#6B7280',
                marginTop: 2,
              }}
            >
              {summary.lockedNodes}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View
          style={{
            height: 4,
            backgroundColor: '#1F2937',
            borderRadius: 2,
          }}
        >
          <View
            style={{
              width: `${summary.completionPercent || 0}%`,
              height: '100%',
              backgroundColor: MASTERY_COLORS.mastered,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {/* Constellation View */}
      <View style={{ flex: 1 }}>
        <Svg width={svgWidth} height={svgHeight}>
          {/* Background stars (decorative) */}
          {Array.from({ length: 50 }).map((_, i) => (
            <SvgCircle
              key={`bg-star-${i}`}
              cx={Math.random() * svgWidth}
              cy={Math.random() * svgHeight}
              r={Math.random() * 1.5 + 0.5}
              fill="#FFFFFF"
              opacity={Math.random() * 0.3 + 0.1}
            />
          ))}

          {/* Edges */}
          {transformedEdges.map((edge, index) => (
            <Edge key={`edge-${index}`} edge={edge} />
          ))}

          {/* Nodes */}
          {transformedNodes.map((node) => (
            <SkillNode
              key={node.id}
              node={node}
              onPress={handleNodePress}
            />
          ))}
        </Svg>

        {/* Node labels */}
        {transformedNodes.map((node) => (
          <TouchableOpacity
            key={`label-${node.id}`}
            onPress={() => handleNodePress(node)}
            style={{
              position: 'absolute',
              left: node.position.x - 50,
              top: node.position.y + 30,
              width: 100,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Urbanist_500Medium',
                fontSize: 11,
                color: '#9CA3AF',
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {node.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Node Panel */}
      <NodeDetailPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onStartLearning={handleStartLearning}
      />
    </View>
  );
}
