import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

/**
 * Brok - The friendly green mascot
 * A cute frog/blob character with big expressive eyes
 */
export default function BrokMascot({
  size = 120,
  mood = 'happy', // happy, excited, thinking, celebrating, encouraging
  style,
}) {
  const scale = size / 120;

  // Different expressions based on mood
  const getExpression = () => {
    switch (mood) {
      case 'excited':
        return { eyeScale: 1.15, mouthOpen: true, sparkles: true, blush: true };
      case 'thinking':
        return { eyeScale: 0.95, mouthOpen: false, eyebrowRaised: true, lookUp: true };
      case 'celebrating':
        return { eyeScale: 1.2, mouthOpen: true, mouthBig: true, sparkles: true, confetti: true, blush: true };
      case 'encouraging':
        return { eyeScale: 1.1, mouthOpen: true, wink: true, blush: true };
      case 'happy':
      default:
        return { eyeScale: 1, mouthOpen: true, blush: true };
    }
  };

  const expression = getExpression();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          {/* Body gradient */}
          <RadialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#9AE89A" />
            <Stop offset="100%" stopColor="#6BCB6B" />
          </RadialGradient>
          {/* Belly gradient */}
          <RadialGradient id="bellyGradient" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#C5F5C5" />
            <Stop offset="100%" stopColor="#9AE89A" />
          </RadialGradient>
          {/* Eye shine */}
          <LinearGradient id="eyeShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E0E0" />
          </LinearGradient>
        </Defs>

        <G transform={`scale(${scale})`}>
          {/* Shadow */}
          <Ellipse cx="60" cy="112" rx="38" ry="6" fill="rgba(0,0,0,0.08)" />

          {/* Confetti for celebrating mood */}
          {expression.confetti && (
            <>
              <Circle cx="15" cy="15" r="4" fill="#FF9ECD" />
              <Circle cx="105" cy="12" r="4" fill="#9AD8FF" />
              <Circle cx="25" cy="8" r="3" fill="#FFD700" />
              <Circle cx="95" cy="5" r="3" fill="#C9A8FF" />
              <Circle cx="8" cy="35" r="3" fill="#FFB088" />
              <Circle cx="112" cy="30" r="3" fill="#7DD87D" />
              <Path d="M18 25 L21 20 L24 25 L21 30 Z" fill="#FFD700" />
              <Path d="M96 20 L99 15 L102 20 L99 25 Z" fill="#FF9ECD" />
            </>
          )}

          {/* Main body */}
          <Path
            d="M18 62 C18 28, 102 28, 102 62 C102 95, 85 108, 60 108 C35 108, 18 95, 18 62"
            fill="url(#bodyGradient)"
          />

          {/* Lighter belly */}
          <Path
            d="M32 68 C32 50, 88 50, 88 68 C88 92, 75 100, 60 100 C45 100, 32 92, 32 68"
            fill="url(#bellyGradient)"
          />

          {/* Left ear/antenna */}
          <Ellipse cx="35" cy="32" rx="10" ry="12" fill="#6BCB6B" />
          <Ellipse cx="35" cy="28" rx="5" ry="6" fill="#9AE89A" />

          {/* Right ear/antenna */}
          <Ellipse cx="85" cy="32" rx="10" ry="12" fill="#6BCB6B" />
          <Ellipse cx="85" cy="28" rx="5" ry="6" fill="#9AE89A" />

          {/* Left eye white (big!) */}
          <Ellipse
            cx="42"
            cy="52"
            rx={16 * expression.eyeScale}
            ry={18 * expression.eyeScale}
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="0.5"
          />

          {/* Right eye white (big!) */}
          <Ellipse
            cx="78"
            cy="52"
            rx={16 * expression.eyeScale}
            ry={18 * expression.eyeScale}
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="0.5"
          />

          {/* Left eye pupil */}
          <Circle
            cx={expression.lookUp ? 40 : 44}
            cy={expression.lookUp ? 48 : 54}
            r={10 * expression.eyeScale}
            fill="#1A1A2E"
          />
          {/* Left eye highlight (big shine) */}
          <Circle cx={expression.lookUp ? 37 : 41} cy={expression.lookUp ? 45 : 50} r={4 * expression.eyeScale} fill="white" />
          <Circle cx={expression.lookUp ? 43 : 47} cy={expression.lookUp ? 52 : 57} r={2 * expression.eyeScale} fill="white" opacity="0.7" />

          {/* Right eye pupil / wink */}
          {expression.wink ? (
            <Path
              d="M68 54 Q78 60, 88 54"
              stroke="#1A1A2E"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <>
              <Circle
                cx={expression.lookUp ? 76 : 80}
                cy={expression.lookUp ? 48 : 54}
                r={10 * expression.eyeScale}
                fill="#1A1A2E"
              />
              {/* Right eye highlight */}
              <Circle cx={expression.lookUp ? 73 : 77} cy={expression.lookUp ? 45 : 50} r={4 * expression.eyeScale} fill="white" />
              <Circle cx={expression.lookUp ? 79 : 83} cy={expression.lookUp ? 52 : 57} r={2 * expression.eyeScale} fill="white" opacity="0.7" />
            </>
          )}

          {/* Blush marks */}
          {expression.blush && (
            <>
              <Ellipse cx="25" cy="68" rx="10" ry="6" fill="#FFB8B8" opacity="0.5" />
              <Ellipse cx="95" cy="68" rx="10" ry="6" fill="#FFB8B8" opacity="0.5" />
            </>
          )}

          {/* Mouth */}
          {expression.mouthOpen ? (
            expression.mouthBig ? (
              // Big happy mouth for celebrating
              <Path
                d="M42 78 Q60 98, 78 78"
                stroke="#1A1A2E"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              // Normal happy smile
              <Path
                d="M45 78 Q60 92, 75 78"
                stroke="#1A1A2E"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            )
          ) : (
            // Closed thinking mouth
            <Path
              d="M48 80 Q60 85, 72 80"
              stroke="#1A1A2E"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Sparkles for excited/celebrating mood */}
          {expression.sparkles && (
            <>
              <Path d="M12 42 L15 48 L12 54 L9 48 Z" fill="#FFD700" />
              <Path d="M108 38 L111 44 L108 50 L105 44 Z" fill="#FFD700" />
              <Circle cx="5" cy="55" r="3" fill="#FF9ECD" />
              <Circle cx="115" cy="50" r="3" fill="#9AD8FF" />
              <Path d="M20 18 L22 22 L20 26 L18 22 Z" fill="#C9A8FF" />
              <Path d="M100 15 L102 19 L100 23 L98 19 Z" fill="#FFB088" />
            </>
          )}

          {/* Raised eyebrow for thinking */}
          {expression.eyebrowRaised && (
            <Path
              d="M70 36 Q78 32, 86 38"
              stroke="#5BC25B"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
