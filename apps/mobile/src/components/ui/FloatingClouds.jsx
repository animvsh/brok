import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

/**
 * Cloud shape component
 */
function Cloud({ size = 100, opacity = 0.6, color = 'white' }) {
  const scale = size / 100;

  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 100 50">
      <Defs>
        <LinearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
        </LinearGradient>
      </Defs>
      <G transform={`scale(${scale})`}>
        {/* Main cloud body */}
        <Ellipse cx="50" cy="35" rx="35" ry="15" fill="url(#cloudGrad)" />
        <Ellipse cx="30" cy="30" rx="20" ry="18" fill="url(#cloudGrad)" />
        <Ellipse cx="70" cy="30" rx="22" ry="16" fill="url(#cloudGrad)" />
        <Ellipse cx="45" cy="22" rx="18" ry="15" fill="url(#cloudGrad)" />
        <Ellipse cx="60" cy="20" rx="15" ry="13" fill="url(#cloudGrad)" />
      </G>
    </Svg>
  );
}

/**
 * Floating clouds decoration for backgrounds
 */
export default function FloatingClouds({ variant = 'bottom', style }) {
  if (variant === 'bottom') {
    return (
      <View style={[styles.bottomClouds, style]} pointerEvents="none">
        <View style={styles.cloudRow}>
          <View style={styles.cloudLeft}>
            <Cloud size={180} opacity={0.7} />
          </View>
          <View style={styles.cloudRight}>
            <Cloud size={200} opacity={0.6} />
          </View>
        </View>
        <View style={styles.cloudRowBack}>
          <View style={styles.cloudCenter}>
            <Cloud size={250} opacity={0.4} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'scattered') {
    return (
      <View style={[styles.scatteredClouds, style]} pointerEvents="none">
        <View style={[styles.cloud, { top: '10%', left: -30 }]}>
          <Cloud size={100} opacity={0.3} />
        </View>
        <View style={[styles.cloud, { top: '20%', right: -20 }]}>
          <Cloud size={80} opacity={0.25} />
        </View>
        <View style={[styles.cloud, { top: '50%', left: -40 }]}>
          <Cloud size={120} opacity={0.35} />
        </View>
        <View style={[styles.cloud, { bottom: '30%', right: -30 }]}>
          <Cloud size={90} opacity={0.3} />
        </View>
        <View style={[styles.cloud, { bottom: '15%', left: 20 }]}>
          <Cloud size={140} opacity={0.4} />
        </View>
        <View style={[styles.cloud, { bottom: '10%', right: 10 }]}>
          <Cloud size={160} opacity={0.5} />
        </View>
      </View>
    );
  }

  // Full coverage
  return (
    <View style={[styles.fullClouds, style]} pointerEvents="none">
      {/* Top clouds */}
      <View style={styles.topRow}>
        <Cloud size={120} opacity={0.25} />
        <Cloud size={100} opacity={0.2} />
      </View>
      {/* Middle clouds */}
      <View style={styles.middleRow}>
        <Cloud size={80} opacity={0.15} />
        <Cloud size={90} opacity={0.2} />
      </View>
      {/* Bottom clouds */}
      <View style={styles.bottomRow}>
        <Cloud size={200} opacity={0.6} />
        <Cloud size={180} opacity={0.5} />
        <Cloud size={220} opacity={0.7} />
      </View>
    </View>
  );
}

/**
 * Decorative bubble elements
 */
export function DecorativeBubbles({ style }) {
  return (
    <View style={[styles.bubblesContainer, style]} pointerEvents="none">
      <View style={[styles.bubble, styles.bubble1]} />
      <View style={[styles.bubble, styles.bubble2]} />
      <View style={[styles.bubble, styles.bubble3]} />
      <View style={[styles.bubble, styles.bubble4]} />
      <View style={[styles.bubble, styles.bubble5]} />
      <View style={[styles.bubble, styles.bubble6]} />
      <View style={[styles.bubble, styles.bubble7]} />
      <View style={[styles.bubble, styles.bubble8]} />
    </View>
  );
}

/**
 * Star sparkle decoration
 */
export function StarSparkle({ size = 20, color = '#FFD700', style }) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path
          d="M10 0 L11 8 L20 10 L11 12 L10 20 L9 12 L0 10 L9 8 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Bottom clouds style
  bottomClouds: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  cloudRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cloudRowBack: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cloudLeft: {
    marginLeft: -50,
  },
  cloudRight: {
    marginRight: -60,
  },
  cloudCenter: {},

  // Scattered clouds
  scatteredClouds: {
    ...StyleSheet.absoluteFillObject,
  },
  cloud: {
    position: 'absolute',
  },

  // Full coverage
  fullClouds: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  middleRow: {
    position: 'absolute',
    top: '40%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  bottomRow: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },

  // Bubbles
  bubblesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
  },
  bubble1: {
    width: 60,
    height: 60,
    top: '8%',
    left: -15,
  },
  bubble2: {
    width: 40,
    height: 40,
    top: '15%',
    right: -10,
  },
  bubble3: {
    width: 80,
    height: 80,
    top: '45%',
    left: -25,
  },
  bubble4: {
    width: 35,
    height: 35,
    top: '35%',
    right: 20,
  },
  bubble5: {
    width: 50,
    height: 50,
    bottom: '25%',
    right: -15,
  },
  bubble6: {
    width: 30,
    height: 30,
    bottom: '35%',
    left: 25,
  },
  bubble7: {
    width: 25,
    height: 25,
    top: '25%',
    left: '30%',
  },
  bubble8: {
    width: 20,
    height: 20,
    top: '60%',
    right: '25%',
  },
});
