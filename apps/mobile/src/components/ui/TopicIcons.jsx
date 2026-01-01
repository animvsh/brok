import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * Guitar emoji icon
 */
export function GuitarIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="guitarBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4A574" />
          <Stop offset="100%" stopColor="#8B6914" />
        </LinearGradient>
      </Defs>
      {/* Guitar body */}
      <Ellipse cx="16" cy="22" rx="10" ry="8" fill="url(#guitarBody)" />
      <Ellipse cx="16" cy="22" rx="4" ry="3" fill="#4A3728" />
      {/* Neck */}
      <Rect x="14" y="4" width="4" height="14" rx="1" fill="#8B6914" />
      {/* Head */}
      <Ellipse cx="16" cy="4" rx="4" ry="3" fill="#4A3728" />
      {/* Strings */}
      <Path d="M15 8 L15 22" stroke="#E0E0E0" strokeWidth="0.5" />
      <Path d="M17 8 L17 22" stroke="#E0E0E0" strokeWidth="0.5" />
      {/* Tuning pegs */}
      <Circle cx="13" cy="3" r="1" fill="#FFD700" />
      <Circle cx="19" cy="3" r="1" fill="#FFD700" />
      <Circle cx="13" cy="5" r="1" fill="#FFD700" />
      <Circle cx="19" cy="5" r="1" fill="#FFD700" />
    </Svg>
  );
}

/**
 * Data/Code brain icon (for Data Structures)
 */
export function DataBrainIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7DD87D" />
          <Stop offset="100%" stopColor="#4CAF50" />
        </LinearGradient>
      </Defs>
      {/* Brain shape */}
      <Path
        d="M8 16 C8 10, 12 6, 16 6 C20 6, 24 10, 24 16 C24 22, 20 26, 16 26 C12 26, 8 22, 8 16"
        fill="url(#brainGrad)"
      />
      {/* Brain ridges */}
      <Path d="M12 12 Q16 10, 20 12" stroke="#3D8B40" strokeWidth="1.5" fill="none" />
      <Path d="M10 16 Q16 14, 22 16" stroke="#3D8B40" strokeWidth="1.5" fill="none" />
      <Path d="M12 20 Q16 18, 20 20" stroke="#3D8B40" strokeWidth="1.5" fill="none" />
      {/* Number 5 badge */}
      <Circle cx="22" cy="10" r="6" fill="#2196F3" />
      <Path d="M19 8 L24 8 L19 10 Q23 10, 23 12 Q23 14, 20 14" stroke="white" strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

/**
 * Psychology brain icon
 */
export function PsychologyIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="pinkBrain" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF9ECD" />
          <Stop offset="100%" stopColor="#E91E63" />
        </LinearGradient>
      </Defs>
      {/* Brain halves */}
      <Path
        d="M6 16 C6 9, 11 5, 15 5 C15 5, 15 12, 15 16 C15 20, 15 27, 15 27 C11 27, 6 23, 6 16"
        fill="url(#pinkBrain)"
      />
      <Path
        d="M26 16 C26 9, 21 5, 17 5 C17 5, 17 12, 17 16 C17 20, 17 27, 17 27 C21 27, 26 23, 26 16"
        fill="#FF69B4"
      />
      {/* Brain details */}
      <Path d="M9 12 Q12 10, 14 13" stroke="#C2185B" strokeWidth="1" fill="none" />
      <Path d="M9 18 Q12 16, 14 19" stroke="#C2185B" strokeWidth="1" fill="none" />
      <Path d="M23 12 Q20 10, 18 13" stroke="#FF1493" strokeWidth="1" fill="none" />
      <Path d="M23 18 Q20 16, 18 19" stroke="#FF1493" strokeWidth="1" fill="none" />
      {/* Sparkle */}
      <Circle cx="24" cy="8" r="2" fill="#FFD700" />
    </Svg>
  );
}

/**
 * Fitness dumbbell icon
 */
export function FitnessIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="dumbbellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#64B5F6" />
          <Stop offset="100%" stopColor="#1976D2" />
        </LinearGradient>
      </Defs>
      {/* Bar */}
      <Rect x="8" y="14" width="16" height="4" rx="2" fill="#424242" />
      {/* Left weights */}
      <Rect x="4" y="10" width="5" height="12" rx="1" fill="url(#dumbbellGrad)" />
      <Rect x="6" y="8" width="3" height="16" rx="1" fill="#1565C0" />
      {/* Right weights */}
      <Rect x="23" y="10" width="5" height="12" rx="1" fill="url(#dumbbellGrad)" />
      <Rect x="23" y="8" width="3" height="16" rx="1" fill="#1565C0" />
    </Svg>
  );
}

/**
 * Sparkle/Magic icon (for Something Else)
 */
export function SparkleIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Main star */}
      <Path
        d="M16 2 L18 12 L28 14 L18 16 L16 26 L14 16 L4 14 L14 12 Z"
        fill="#FFB74D"
      />
      {/* Small sparkles */}
      <Circle cx="6" cy="6" r="2" fill="#FF9800" />
      <Circle cx="26" cy="8" r="1.5" fill="#FFC107" />
      <Circle cx="8" cy="24" r="1.5" fill="#FFD54F" />
      <Circle cx="24" cy="22" r="2" fill="#FF9800" />
      {/* Center glow */}
      <Circle cx="16" cy="14" r="3" fill="#FFF59D" />
    </Svg>
  );
}

/**
 * Laptop/Programming icon
 */
export function LaptopIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#E3F2FD" />
          <Stop offset="100%" stopColor="#90CAF9" />
        </LinearGradient>
      </Defs>
      {/* Screen */}
      <Rect x="4" y="6" width="24" height="16" rx="2" fill="#424242" />
      <Rect x="6" y="8" width="20" height="12" rx="1" fill="url(#screenGrad)" />
      {/* Code lines */}
      <Rect x="8" y="10" width="8" height="2" rx="1" fill="#2196F3" />
      <Rect x="8" y="14" width="12" height="2" rx="1" fill="#4CAF50" />
      <Rect x="8" y="18" width="6" height="1" rx="0.5" fill="#9E9E9E" />
      {/* Base */}
      <Path d="M2 22 L30 22 L28 26 L4 26 Z" fill="#616161" />
      {/* Star badge */}
      <Circle cx="24" cy="10" r="4" fill="#2196F3" />
      <Path d="M24 7 L25 9 L27 9 L25.5 10.5 L26 12.5 L24 11.5 L22 12.5 L22.5 10.5 L21 9 L23 9 Z" fill="white" />
    </Svg>
  );
}

/**
 * Languages/Globe icon
 */
export function LanguagesIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#81D4FA" />
          <Stop offset="100%" stopColor="#0288D1" />
        </LinearGradient>
      </Defs>
      {/* Globe */}
      <Circle cx="16" cy="16" r="12" fill="url(#globeGrad)" />
      {/* Continents */}
      <Ellipse cx="16" cy="16" rx="12" ry="4" fill="none" stroke="#4FC3F7" strokeWidth="1" />
      <Ellipse cx="16" cy="16" rx="4" ry="12" fill="none" stroke="#4FC3F7" strokeWidth="1" />
      {/* Land masses */}
      <Path d="M8 12 Q12 10, 14 14 Q10 16, 8 12" fill="#4CAF50" />
      <Path d="M18 8 Q22 10, 20 14 Q18 12, 18 8" fill="#66BB6A" />
      <Path d="M14 18 Q18 20, 22 18 Q20 22, 14 18" fill="#81C784" />
      {/* Highlight */}
      <Circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.3)" />
    </Svg>
  );
}

/**
 * Calculator/Math icon
 */
export function MathIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A5D6A7" />
          <Stop offset="100%" stopColor="#4CAF50" />
        </LinearGradient>
      </Defs>
      {/* Calculator body */}
      <Rect x="6" y="4" width="20" height="24" rx="3" fill="url(#calcGrad)" />
      {/* Screen */}
      <Rect x="8" y="6" width="16" height="6" rx="1" fill="#1B5E20" />
      <Path d="M10 10 L22 10" stroke="#81C784" strokeWidth="1.5" />
      {/* Buttons */}
      <Rect x="8" y="14" width="4" height="3" rx="0.5" fill="white" />
      <Rect x="14" y="14" width="4" height="3" rx="0.5" fill="white" />
      <Rect x="20" y="14" width="4" height="3" rx="0.5" fill="#FF9800" />
      <Rect x="8" y="19" width="4" height="3" rx="0.5" fill="white" />
      <Rect x="14" y="19" width="4" height="3" rx="0.5" fill="white" />
      <Rect x="20" y="19" width="4" height="3" rx="0.5" fill="white" />
      <Rect x="8" y="24" width="10" height="3" rx="0.5" fill="white" />
      <Rect x="20" y="24" width="4" height="3" rx="0.5" fill="#2196F3" />
    </Svg>
  );
}

/**
 * Science/Flask icon
 */
export function ScienceIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#4DD0E1" />
          <Stop offset="100%" stopColor="#00ACC1" />
        </LinearGradient>
      </Defs>
      {/* Flask neck */}
      <Rect x="13" y="4" width="6" height="8" fill="#E0E0E0" />
      <Rect x="11" y="4" width="10" height="2" rx="1" fill="#9E9E9E" />
      {/* Flask body */}
      <Path
        d="M13 12 L6 24 Q4 28, 8 28 L24 28 Q28 28, 26 24 L19 12"
        fill="#E0E0E0"
        stroke="#BDBDBD"
        strokeWidth="1"
      />
      {/* Liquid */}
      <Path
        d="M8 22 L24 22 Q26 26, 24 26 L8 26 Q6 26, 8 22"
        fill="url(#liquidGrad)"
      />
      {/* Bubbles */}
      <Circle cx="12" cy="24" r="1.5" fill="#80DEEA" />
      <Circle cx="18" cy="23" r="1" fill="#B2EBF2" />
      <Circle cx="15" cy="25" r="0.8" fill="#E0F7FA" />
    </Svg>
  );
}

/**
 * Animal icons for quiz options
 */
export function EagleIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Bird body */}
      <Ellipse cx="16" cy="18" rx="8" ry="6" fill="#455A64" />
      {/* Head */}
      <Circle cx="20" cy="12" r="5" fill="#37474F" />
      {/* Beak */}
      <Path d="M24 12 L28 14 L24 14 Z" fill="#FFB74D" />
      {/* Eye */}
      <Circle cx="21" cy="11" r="2" fill="white" />
      <Circle cx="22" cy="11" r="1" fill="black" />
      {/* Wing */}
      <Path d="M10 18 Q6 14, 4 20 Q8 22, 12 20" fill="#546E7A" />
      {/* Tail */}
      <Path d="M8 20 Q4 24, 6 26 L10 22" fill="#37474F" />
    </Svg>
  );
}

export function FrogIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Body */}
      <Ellipse cx="16" cy="20" rx="10" ry="8" fill="#66BB6A" />
      {/* Eyes */}
      <Circle cx="10" cy="12" r="5" fill="#81C784" />
      <Circle cx="22" cy="12" r="5" fill="#81C784" />
      <Circle cx="10" cy="12" r="3" fill="white" />
      <Circle cx="22" cy="12" r="3" fill="white" />
      <Circle cx="11" cy="12" r="1.5" fill="black" />
      <Circle cx="23" cy="12" r="1.5" fill="black" />
      {/* Mouth */}
      <Path d="M10 22 Q16 26, 22 22" stroke="#388E3C" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function DolphinIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="dolphinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#64B5F6" />
          <Stop offset="100%" stopColor="#1976D2" />
        </LinearGradient>
      </Defs>
      {/* Body */}
      <Path
        d="M4 16 Q8 10, 16 12 Q24 14, 28 18 Q24 20, 20 18 Q16 16, 8 18 Q4 20, 4 16"
        fill="url(#dolphinGrad)"
      />
      {/* Belly */}
      <Path d="M8 17 Q14 20, 22 18" fill="#BBDEFB" />
      {/* Fin */}
      <Path d="M14 12 L16 6 L18 12" fill="#1976D2" />
      {/* Tail */}
      <Path d="M4 16 L2 12 L6 14" fill="#1976D2" />
      <Path d="M4 16 L2 20 L6 18" fill="#1976D2" />
      {/* Eye */}
      <Circle cx="22" cy="14" r="1.5" fill="white" />
      <Circle cx="22.5" cy="14" r="0.8" fill="black" />
      {/* Nose */}
      <Path d="M26 17 Q28 16, 28 18" stroke="#0D47A1" strokeWidth="1" fill="none" />
    </Svg>
  );
}

export function BatIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Wings */}
      <Path
        d="M2 14 Q6 8, 10 12 Q8 16, 6 14 Q4 18, 2 14"
        fill="#37474F"
      />
      <Path
        d="M30 14 Q26 8, 22 12 Q24 16, 26 14 Q28 18, 30 14"
        fill="#37474F"
      />
      {/* Body */}
      <Ellipse cx="16" cy="18" rx="6" ry="8" fill="#455A64" />
      {/* Head */}
      <Circle cx="16" cy="12" r="5" fill="#37474F" />
      {/* Ears */}
      <Path d="M12 8 L10 4 L14 8" fill="#455A64" />
      <Path d="M20 8 L22 4 L18 8" fill="#455A64" />
      {/* Eyes */}
      <Circle cx="14" cy="11" r="1.5" fill="white" />
      <Circle cx="18" cy="11" r="1.5" fill="white" />
      <Circle cx="14" cy="11" r="0.8" fill="black" />
      <Circle cx="18" cy="11" r="0.8" fill="black" />
    </Svg>
  );
}

/**
 * Reason icons
 */
export function SmileIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="14" fill="#FFD54F" />
      <Circle cx="11" cy="13" r="2" fill="#5D4037" />
      <Circle cx="21" cy="13" r="2" fill="#5D4037" />
      <Path d="M10 20 Q16 26, 22 20" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function GradCapIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Cap top */}
      <Path d="M16 6 L30 12 L16 18 L2 12 Z" fill="#1565C0" />
      {/* Cap base */}
      <Path d="M6 14 L6 20 Q16 26, 26 20 L26 14" fill="#1976D2" />
      {/* Button */}
      <Circle cx="16" cy="12" r="2" fill="#FFC107" />
      {/* Tassel */}
      <Path d="M28 12 L28 20" stroke="#FFC107" strokeWidth="2" />
      <Circle cx="28" cy="22" r="2" fill="#FFC107" />
    </Svg>
  );
}

export function BriefcaseIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="briefGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#7986CB" />
          <Stop offset="100%" stopColor="#3F51B5" />
        </LinearGradient>
      </Defs>
      {/* Handle */}
      <Path d="M12 10 L12 8 Q12 6, 14 6 L18 6 Q20 6, 20 8 L20 10" stroke="#5C6BC0" strokeWidth="2" fill="none" />
      {/* Body */}
      <Rect x="4" y="10" width="24" height="16" rx="3" fill="url(#briefGrad)" />
      {/* Clasp */}
      <Rect x="14" y="16" width="4" height="4" rx="1" fill="#FFC107" />
    </Svg>
  );
}

export function SearchIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="14" cy="14" r="8" fill="none" stroke="#9C27B0" strokeWidth="3" />
      <Path d="M20 20 L28 28" stroke="#9C27B0" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="14" cy="14" r="4" fill="#E1BEE7" />
    </Svg>
  );
}

export function HeartIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M16 28 Q4 18, 4 10 Q4 4, 10 4 Q14 4, 16 8 Q18 4, 22 4 Q28 4, 28 10 Q28 18, 16 28"
        fill="#F06292"
      />
      <Ellipse cx="10" cy="10" rx="3" ry="2" fill="#F8BBD9" opacity="0.6" />
    </Svg>
  );
}

export function TrophyIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD54F" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </LinearGradient>
      </Defs>
      {/* Cup */}
      <Path
        d="M8 6 L24 6 L22 18 Q20 22, 16 22 Q12 22, 10 18 Z"
        fill="url(#trophyGrad)"
      />
      {/* Handles */}
      <Path d="M8 8 Q4 8, 4 12 Q4 16, 8 16" stroke="#FFB300" strokeWidth="2" fill="none" />
      <Path d="M24 8 Q28 8, 28 12 Q28 16, 24 16" stroke="#FFB300" strokeWidth="2" fill="none" />
      {/* Base */}
      <Rect x="12" y="22" width="8" height="4" fill="#FF8F00" />
      <Rect x="10" y="26" width="12" height="2" rx="1" fill="#E65100" />
      {/* Star */}
      <Path d="M16 10 L17 13 L20 13 L18 15 L19 18 L16 16 L13 18 L14 15 L12 13 L15 13 Z" fill="white" />
    </Svg>
  );
}

const styles = StyleSheet.create({});
