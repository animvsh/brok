import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Parse user input to extract learning intent
 * Returns structured intent object with domain, goals, keywords, signals
 *
 * @param {string} rawInput - User's raw input text
 * @returns {Object} Parsed intent
 */
export async function parseIntent(rawInput) {
  if (!OPENAI_API_KEY) {
    // Fallback parsing without AI
    return fallbackParseIntent(rawInput);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `You are an expert at understanding learning goals. Parse the user's input and return a structured JSON object.

Return this exact structure:
{
  "domain_candidates": [
    {"domain": "string", "score": 0.0-1.0}
  ],
  "goal_type": "learn | prep_exam | build_project | fix_gap",
  "primary_outcome": "what the user wants to achieve",
  "keywords": ["relevant", "keywords"],
  "signals": {
    "urgency": 0.0-1.0,
    "confidence": 0.0-1.0,
    "depth": "survey | practical | expert"
  },
  "suggested_title": "Short descriptive title for this learning goal",
  "clarification_needed": false,
  "clarification_question": null
}

Domain examples: programming, languages, math, science, business, design, music, etc.
Be specific about domain - "python_programming" is better than just "programming".`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return {
      ...parsed,
      raw_input: rawInput,
      parsed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Intent parsing error:', error);
    return fallbackParseIntent(rawInput);
  }
}

/**
 * Fallback intent parsing without AI
 * Uses simple heuristics to extract intent
 */
function fallbackParseIntent(rawInput) {
  const input = rawInput.toLowerCase();
  const words = input.split(/\s+/);

  // Simple domain detection
  const domainKeywords = {
    programming: ['code', 'programming', 'python', 'javascript', 'java', 'coding', 'developer', 'software'],
    languages: ['spanish', 'french', 'german', 'language', 'speak', 'vocabulary', 'grammar'],
    math: ['math', 'calculus', 'algebra', 'geometry', 'statistics', 'numbers'],
    business: ['business', 'marketing', 'management', 'startup', 'entrepreneur'],
    design: ['design', 'ui', 'ux', 'graphic', 'photoshop', 'figma'],
    music: ['music', 'guitar', 'piano', 'singing', 'instrument'],
    science: ['science', 'physics', 'chemistry', 'biology'],
  };

  const domainCandidates = [];
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const matches = keywords.filter((k) => input.includes(k)).length;
    if (matches > 0) {
      domainCandidates.push({
        domain,
        score: Math.min(1, matches * 0.3),
      });
    }
  }

  // If no domain detected, use "general"
  if (domainCandidates.length === 0) {
    domainCandidates.push({ domain: 'general', score: 0.5 });
  }

  // Sort by score
  domainCandidates.sort((a, b) => b.score - a.score);

  // Detect goal type
  let goalType = 'learn';
  if (input.includes('exam') || input.includes('test') || input.includes('certification')) {
    goalType = 'prep_exam';
  } else if (input.includes('build') || input.includes('project') || input.includes('create')) {
    goalType = 'build_project';
  } else if (input.includes('fix') || input.includes('improve') || input.includes('better')) {
    goalType = 'fix_gap';
  }

  // Extract keywords (simple approach: take non-common words)
  const commonWords = new Set(['i', 'want', 'to', 'learn', 'how', 'the', 'a', 'an', 'is', 'are', 'about', 'for', 'and', 'or', 'but']);
  const keywords = words.filter((w) => w.length > 2 && !commonWords.has(w)).slice(0, 10);

  return {
    domain_candidates: domainCandidates,
    goal_type: goalType,
    primary_outcome: rawInput,
    keywords,
    signals: {
      urgency: 0.5,
      confidence: 0.3,
      depth: 'practical',
    },
    suggested_title: rawInput.slice(0, 50) + (rawInput.length > 50 ? '...' : ''),
    clarification_needed: false,
    clarification_question: null,
    raw_input: rawInput,
    parsed_at: new Date().toISOString(),
    _fallback: true,
  };
}

/**
 * Build goal spec from parsed intent and optional user preferences
 */
export function buildGoalSpec(parsedIntent, userPreferences = {}) {
  return {
    domain: parsedIntent.domain_candidates[0]?.domain || 'general',
    primary_outcome: parsedIntent.primary_outcome,
    time_horizon: userPreferences.time_horizon || 'unknown',
    depth_target: parsedIntent.signals?.depth || 'practical',
    constraints: {
      time_per_day_min: userPreferences.time_per_day || 15,
      preferred_format: userPreferences.preferred_format || ['examples', 'practice'],
      avoid: userPreferences.avoid || [],
    },
    evaluation_style: userPreferences.evaluation_style || 'normal',
    user_context: {
      role: userPreferences.role || 'learner',
      current_level_guess: 'unknown',
    },
  };
}

export default parseIntent;
