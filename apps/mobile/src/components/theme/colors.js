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

  // Accent colors (vibrant for course cards)
  accent: {
    orange: '#FF8A65',
    pink: '#F06292',
    blue: '#42A5F5',
    purple: '#AB47BC',
    yellow: '#FFD54F',
    coral: '#FF8A80',
    teal: '#26A69A',
    indigo: '#5C6BC0',
  },

  // Dark theme background colors
  background: {
    dark: '#000000',
    card: '#1A1A1A',
    cardLight: '#2A2A2A',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors (dark theme)
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    tertiary: '#808080',
    light: '#FFFFFF',
    muted: '#666666',
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

  // Option pill colors (dark theme)
  pill: {
    selected: '#6366F1',
    unselected: '#2A2A2A',
    correct: '#4CAF50',
    incorrect: '#FF5252',
    locked: '#333333',
  },

  // Borders and shadows (dark theme)
  border: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(255, 255, 255, 0.2)',
  },

  // Course card colors (vibrant gradients)
  courseCard: {
    blue: '#3B82F6',
    orange: '#F97316',
    pink: '#EC4899',
    purple: '#A855F7',
    teal: '#14B8A6',
    indigo: '#6366F1',
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
