import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

/**
 * Gradient background with decorative bubbles
 */
export default function GradientBackground({
  variant = 'warmSunset', // warmSunset, coolOcean, softPink, softBlue, purpleDream
  children,
  style,
  showBubbles = true,
}) {
  const colors = GRADIENTS[variant] || GRADIENTS.warmSunset;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Decorative bubbles */}
      {showBubbles && (
        <>
          <View style={[styles.bubble, styles.bubble1]} />
          <View style={[styles.bubble, styles.bubble2]} />
          <View style={[styles.bubble, styles.bubble3]} />
          <View style={[styles.bubble, styles.bubble4]} />
          <View style={[styles.bubble, styles.bubble5]} />
          <View style={[styles.bubble, styles.bubble6]} />
        </>
      )}

      {children}
    </View>
  );
}

/**
 * Decorative cloud/bubble element
 */
export function CloudDecoration({ style }) {
  return (
    <View style={[styles.cloudContainer, style]}>
      <View style={styles.cloudMain} />
      <View style={styles.cloudLeft} />
      <View style={styles.cloudRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
  },
  bubble1: {
    width: 80,
    height: 80,
    top: height * 0.1,
    left: -20,
  },
  bubble2: {
    width: 60,
    height: 60,
    top: height * 0.2,
    right: -15,
  },
  bubble3: {
    width: 100,
    height: 100,
    top: height * 0.5,
    left: -30,
  },
  bubble4: {
    width: 50,
    height: 50,
    top: height * 0.4,
    right: 20,
  },
  bubble5: {
    width: 70,
    height: 70,
    bottom: height * 0.2,
    right: -20,
  },
  bubble6: {
    width: 40,
    height: 40,
    bottom: height * 0.3,
    left: 30,
  },
  cloudContainer: {
    position: 'relative',
    width: 120,
    height: 50,
  },
  cloudMain: {
    position: 'absolute',
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    left: 20,
    top: 10,
  },
  cloudLeft: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 25,
    left: 0,
    top: 0,
  },
  cloudRight: {
    position: 'absolute',
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 22.5,
    right: 0,
    top: 5,
  },
});
