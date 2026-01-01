import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase - must be defined before imports
vi.mock('@/app/api/utils/supabase', () => ({
  default: {
    from: vi.fn()
  }
}));

import { GET } from './route.js';
import supabase from '@/app/api/utils/supabase';

describe('GET /api/courses/active', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock chain
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            ascending: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      })
    });
  });

  it('should return null course if userId is missing', async () => {
    const request = new Request('http://localhost/api/courses/active');

    const response = await GET(request);
    const data = await response.json();

    expect(data.course).toBeNull();
    expect(data.error).toBe('User ID required');
  });

  it('should return null course if user has no active course', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { active_course_id: null },
            error: null
          })
        })
      })
    });

    const request = new Request('http://localhost/api/courses/active?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(data.course).toBeNull();
  });

  it('should return active course with modules', async () => {
    const mockProgress = {
      active_course_id: 'course-123',
      current_module_id: 'module-1'
    };
    const mockCourse = {
      id: 'course-123',
      title: 'Test Course',
      total_modules: 3
    };
    const mockModules = [
      { id: 'module-1', title: 'Module 1', module_order: 1 },
      { id: 'module-2', title: 'Module 2', module_order: 2 }
    ];

    let callCount = 0;
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
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockModules, error: null }),
              single: vi.fn().mockResolvedValue({ data: mockModules[0], error: null })
            })
          })
        };
      }
      if (table === 'module_completions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const request = new Request('http://localhost/api/courses/active?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.course).toBeDefined();
  });
});
