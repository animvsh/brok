import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase - must be defined before imports
vi.mock('@/app/api/utils/supabase', () => ({
  default: {
    from: vi.fn()
  }
}));

import { GET } from './route.js';
import supabase from '@/app/api/utils/supabase';

describe('GET /api/progress/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const request = new Request('http://localhost/api/progress/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID required');
  });

  it('should return 404 if progress not found', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        })
      })
    });

    const request = new Request('http://localhost/api/progress/stats?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Progress not found');
  });

  it('should return progress stats with course progress', async () => {
    const mockProgress = {
      total_xp: 500,
      current_streak: 7,
      longest_streak: 14,
      modules_completed: 3,
      active_course_id: 'course-123'
    };
    const mockCourse = {
      id: 'course-123',
      title: 'Test Course',
      total_modules: 10
    };
    const mockModules = [
      { id: 'module-1' },
      { id: 'module-2' },
      { id: 'module-3' }
    ];

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
      if (table === 'courses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCourse, error: null })
            })
          })
        };
      }
      if (table === 'modules') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockModules, error: null })
          })
        };
      }
      if (table === 'module_completions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                count: 3,
                data: null,
                error: null
              })
            })
          })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const request = new Request('http://localhost/api/progress/stats?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBeDefined();
    expect(data.progress.total_xp).toBe(500);
    expect(data.progress.current_streak).toBe(7);
    expect(data.courseProgress).toBeDefined();
  });

  it('should return progress without course progress if no active course', async () => {
    const mockProgress = {
      total_xp: 100,
      current_streak: 1,
      longest_streak: 5,
      modules_completed: 0,
      active_course_id: null
    };

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProgress, error: null })
        })
      })
    });

    const request = new Request('http://localhost/api/progress/stats?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBeDefined();
    expect(data.courseProgress).toBeNull();
  });
});
