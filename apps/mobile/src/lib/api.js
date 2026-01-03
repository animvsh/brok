import { supabase } from './supabase';

// API base URL - defaults to localhost for development
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Get the current auth token from Supabase session
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}

/**
 * Brok API client
 */
export const api = {
  /**
   * Learning Threads (Courses)
   */
  threads: {
    /**
     * Create a new learning thread
     * @param {string} input - What the user wants to learn
     * @param {object} options - Optional: intent, intensity, context
     */
    create: async (input, options = {}) => {
      return apiRequest('/api/threads/create', {
        method: 'POST',
        body: JSON.stringify({ input, ...options }),
      });
    },

    /**
     * Get the next learning unit for a thread
     * @param {string} threadId - Thread UUID
     */
    getNext: async (threadId) => {
      return apiRequest(`/api/threads/${threadId}/next`, {
        method: 'GET',
      });
    },

    /**
     * Get all active threads for the current user
     */
    list: async () => {
      return apiRequest('/api/courses/active', {
        method: 'GET',
      });
    },
  },

  /**
   * Learning Units
   */
  units: {
    /**
     * Submit a response to a learning unit
     * @param {string} unitId - Unit UUID
     * @param {object} response - User's response
     * @param {number} timeSpent - Time spent in ms
     * @param {number} hintCount - Number of hints used
     */
    submit: async (unitId, response, timeSpent = 0, hintCount = 0) => {
      return apiRequest(`/api/units/${unitId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ response, timeSpent, hintCount }),
      });
    },
  },

  /**
   * Progress & Stats
   */
  progress: {
    /**
     * Get user progress stats (XP, streak, etc.)
     */
    stats: async () => {
      return apiRequest('/api/progress/stats', {
        method: 'GET',
      });
    },
  },

  /**
   * Skill Graph Visualization
   */
  graphs: {
    /**
     * Get skill graph for visualization
     * @param {string} threadId - Thread UUID
     */
    visualize: async (threadId) => {
      return apiRequest(`/api/graphs/visualize?threadId=${threadId}`, {
        method: 'GET',
      });
    },
  },

  /**
   * Course Generation (V1 compatibility)
   */
  courses: {
    /**
     * Generate a course from a topic
     * @param {string} topic - Topic to learn
     */
    generate: async (topic) => {
      return apiRequest('/api/courses/generate', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      });
    },

    /**
     * Get active course for user
     */
    getActive: async () => {
      return apiRequest('/api/courses/active', {
        method: 'GET',
      });
    },
  },
};

export default api;
