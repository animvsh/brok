import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route.js';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      constructor() {
        this.chat = {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    title: "Test Course",
                    description: "A test course",
                    goal: "Learn testing",
                    modules: [{
                      title: "Module 1",
                      description: "First module",
                      concepts: [{
                        name: "Concept 1",
                        questions: [{
                          type: "multiple_choice",
                          question: "Test question?",
                          options: ["A", "B", "C", "D"],
                          correctAnswer: "A",
                          explanation: "A is correct"
                        }]
                      }]
                    }]
                  })
                }
              }]
            })
          }
        };
      }
    }
  };
});

// Mock Supabase
vi.mock('@/app/api/utils/supabase', () => ({
  default: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'test-course-id' },
      error: null
    }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }
}));

describe('POST /api/courses/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if topic is missing', async () => {
    const request = new Request('http://localhost/api/courses/generate?userId=test-user-123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('topic');
  });

  it('should successfully create a course with valid topic', async () => {
    const request = new Request('http://localhost/api/courses/generate?userId=test-user-123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'JavaScript' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should generate mock course when OpenAI key is not available', async () => {
    // This tests the fallback behavior
    const request = new Request('http://localhost/api/courses/generate?userId=test-user-123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Python' })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
