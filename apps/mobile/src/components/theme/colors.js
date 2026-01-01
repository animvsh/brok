/**
 * Brok App Color Theme
 * Playful, pastel gradients with bubbly aesthetic
 */

export const GRADIENTS = {
  // Warm sunset gradient (orange-pink)
  warmSunset: ['#FFB88C', '#FF9A9E', '#FECFEF'],

  // Cool ocean gradient (blue-purple)
  coolOcean: ['#A8EDEA', '#9FACE6', '#C3B1E1'],

  // Soft pink gradient
  softPink: ['#FFDEE9', '#FFB8D4', '#FF9ECD'],

  // Soft blue gradient
  softBlue: ['#E0F4FF', '#B8E4FF', '#9AD8FF'],

  // Purple dream gradient
  purpleDream: ['#E8D5FF', '#D4B8FF', '#C9A8FF'],

  // Success green gradient
  successGreen: ['#B8F5B8', '#8AE88A', '#6ADE6A'],

  // Celebration gradient (rainbow)
  celebration: ['#FF9A9E', '#FECFEF', '#A8EDEA', '#9FACE6'],
};

export const COLORS = {
  // Primary brand colors
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Brok mascot green
  brokGreen: '#7DD87D',
  brokGreenDark: '#5BC25B',
  brokGreenLight: '#A8EDA8',

  // Accent colors
  accent: {
    orange: '#FFB088',
    pink: '#FF9ECD',
    blue: '#9AD8FF',
    purple: '#C9A8FF',
    yellow: '#FFE066',
    coral: '#FF8A80',
  },

  // Background colors
  background: {
    warm: '#FFF5F0',
    cool: '#F0F8FF',
    neutral: '#FAFAFA',
    card: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#1A1A2E',
    secondary: '#4A4A6A',
    tertiary: '#8A8AAA',
    light: '#FFFFFF',
    muted: '#B0B0C0',
  },

  // Status colors
  status: {
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFB74D',
    info: '#64B5F6',
  },

  // XP and gamification
  xp: {
    gold: '#FFD700',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
  },

  // Streak colors
  streak: {
    fire: '#FF6B35',
    flame: '#FF9F1C',
    hot: '#FFD93D',
  },

  // Option pill colors
  pill: {
    selected: '#6366F1',
    unselected: '#FFFFFF',
    correct: '#4CAF50',
    incorrect: '#FF5252',
    locked: '#E0E0E0',
  },

  // Borders and shadows
  border: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },

  // Bubble/decoration colors
  bubble: {
    white: 'rgba(255, 255, 255, 0.4)',
    pink: 'rgba(255, 182, 193, 0.3)',
    blue: 'rgba(173, 216, 230, 0.3)',
  },
};

// Topic icons mapping
export const TOPIC_ICONS = {
  guitar: { icon: 'music', color: '#FF8A65' },
  'data structures': { icon: 'code', color: '#64B5F6' },
  psychology: { icon: 'brain', color: '#BA68C8' },
  fitness: { icon: 'dumbbell', color: '#4DB6AC' },
  programming: { icon: 'laptop', color: '#7986CB' },
  languages: { icon: 'languages', color: '#FFD54F' },
  math: { icon: 'calculator', color: '#81C784' },
  science: { icon: 'flask', color: '#4DD0E1' },
  history: { icon: 'book-open', color: '#A1887F' },
  art: { icon: 'palette', color: '#F06292' },
  music: { icon: 'headphones', color: '#9575CD' },
  cooking: { icon: 'utensils', color: '#FFB74D' },
  default: { icon: 'sparkles', color: '#90CAF9' },
};

// Reason icons mapping
export const REASON_ICONS = {
  fun: { icon: 'smile', color: '#FFD54F' },
  school: { icon: 'graduation-cap', color: '#64B5F6' },
  career: { icon: 'briefcase', color: '#7986CB' },
  curiosity: { icon: 'search', color: '#BA68C8' },
  hobby: { icon: 'heart', color: '#F06292' },
  challenge: { icon: 'trophy', color: '#FFB74D' },
};

export default { GRADIENTS, COLORS, TOPIC_ICONS, REASON_ICONS };
