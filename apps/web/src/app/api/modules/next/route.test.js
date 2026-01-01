import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase - must be defined before imports
vi.mock('@/app/api/utils/supabase', () => ({
  default: {
    from: vi.fn()
  }
}));

import { GET } from './route.js';
import supabase from '@/app/api/utils/supabase';

describe('GET /api/modules/next', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const request = new Request('http://localhost/api/modules/next');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID required');
  });

  it('should return 404 if no active module', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    });

    const request = new Request('http://localhost/api/modules/next?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active module');
  });

  it('should return questions for the current module', async () => {
    const mockProgress = {
      current_module_id: 'module-1'
    };
    const mockModule = {
      id: 'module-1',
      title: 'Test Module'
    };
    const mockConcepts = [
      {
        id: 'concept-1',
        concept_name: 'Test Concept',
        concept_data: JSON.stringify([{
          type: 'multiple_choice',
          question: 'Test?',
          options: ['A', 'B'],
          correctAnswer: 'A',
          explanation: 'Test'
        }])
      }
    ];
    const mockSession = { id: 'session-123' };

    supabase.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProgress, error: null })
            })
          })
        };
      }
      if (table === 'modules') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockModule, error: null })
            })
          })
        };
      }
      if (table === 'concepts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockConcepts, error: null })
          })
        };
      }
      if (table === 'user_performance') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
      if (table === 'learning_sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSession, error: null })
            })
          })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const request = new Request('http://localhost/api/modules/next?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.module).toBeDefined();
    expect(data.questions).toBeDefined();
    expect(data.sessionId).toBeDefined();
  });
});
