import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate a skill graph from parsed intent
 * Creates nodes (skills) and edges (prerequisites)
 *
 * @param {Object} parsedIntent - Parsed intent from intentParser
 * @param {Object} goalSpec - Goal specification
 * @returns {Object} { nodes, edges, templateSource }
 */
export async function generateGraph(parsedIntent, goalSpec = {}) {
  const domain = parsedIntent.domain_candidates[0]?.domain || 'general';

  // Try to use a template first
  const template = getTemplateGraph(domain);
  if (template) {
    return {
      ...template,
      templateSource: domain,
    };
  }

  // Generate custom graph with AI
  if (!OPENAI_API_KEY) {
    return generateFallbackGraph(parsedIntent);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `You are an expert curriculum designer. Create a skill graph for learning.

Return a JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "name": "Skill Name",
      "description": "What this skill enables",
      "difficulty": 0.0-1.0,
      "weight": 0.5-2.0,
      "misconceptions": [
        {"tag": "mc_id", "description": "Common mistake", "triggers": ["keywords"]}
      ]
    }
  ],
  "edges": [
    {"from": "prereq_id", "to": "dependent_id", "type": "prerequisite"}
  ]
}

Guidelines:
- Create 20-40 atomic skills (testable, teachable)
- Order from fundamentals to advanced
- Each skill should be achievable in 5-15 minutes of focused practice
- Include common misconceptions
- Weight important skills higher (1.0-2.0)
- Ensure no cycles in prerequisites`;

  const userPrompt = `Create a skill graph for: "${parsedIntent.raw_input}"

Domain: ${domain}
Goal: ${parsedIntent.goal_type}
Keywords: ${parsedIntent.keywords.join(', ')}
Depth: ${goalSpec.depth_target || 'practical'}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const graph = JSON.parse(response.choices[0].message.content);

    // Transform to our format with positions
    const nodesWithPositions = graph.nodes.map((node, index) => ({
      node_id: node.id,
      name: node.name,
      description: node.description,
      difficulty: node.difficulty || 0.5,
      weight: node.weight || 1.0,
      misconceptions_library: node.misconceptions || [],
      prerequisites: [],
      position_x: (index % 5) * 150 + Math.random() * 50,
      position_y: Math.floor(index / 5) * 120 + Math.random() * 30,
    }));

    // Add prerequisites from edges
    for (const edge of graph.edges || []) {
      const node = nodesWithPositions.find((n) => n.node_id === edge.to);
      if (node) {
        node.prerequisites.push(edge.from);
      }
    }

    return {
      nodes: nodesWithPositions,
      edges: graph.edges || [],
      templateSource: 'ai_generated',
    };
  } catch (error) {
    console.error('Graph generation error:', error);
    return generateFallbackGraph(parsedIntent);
  }
}

/**
 * Get a predefined template graph for common domains
 */
function getTemplateGraph(domain) {
  const templates = {
    python_programming: getPythonTemplate(),
    javascript_programming: getJavaScriptTemplate(),
    spanish: getSpanishTemplate(),
    // Add more templates as needed
  };

  return templates[domain] || null;
}

/**
 * Python programming template graph
 */
function getPythonTemplate() {
  const nodes = [
    { id: 'py_variables', name: 'Variables & Data Types', difficulty: 0.2, weight: 1.5 },
    { id: 'py_operators', name: 'Operators & Expressions', difficulty: 0.25, weight: 1.0 },
    { id: 'py_strings', name: 'String Manipulation', difficulty: 0.3, weight: 1.2 },
    { id: 'py_conditionals', name: 'Conditionals (if/else)', difficulty: 0.35, weight: 1.5 },
    { id: 'py_loops', name: 'Loops (for/while)', difficulty: 0.4, weight: 1.5 },
    { id: 'py_lists', name: 'Lists & Tuples', difficulty: 0.4, weight: 1.3 },
    { id: 'py_dicts', name: 'Dictionaries', difficulty: 0.45, weight: 1.2 },
    { id: 'py_functions', name: 'Functions', difficulty: 0.5, weight: 1.8 },
    { id: 'py_scope', name: 'Variable Scope', difficulty: 0.55, weight: 1.0 },
    { id: 'py_modules', name: 'Modules & Imports', difficulty: 0.55, weight: 1.0 },
    { id: 'py_files', name: 'File I/O', difficulty: 0.5, weight: 1.0 },
    { id: 'py_exceptions', name: 'Exception Handling', difficulty: 0.6, weight: 1.2 },
    { id: 'py_classes', name: 'Classes & Objects', difficulty: 0.65, weight: 1.5 },
    { id: 'py_inheritance', name: 'Inheritance', difficulty: 0.7, weight: 1.2 },
    { id: 'py_list_comp', name: 'List Comprehensions', difficulty: 0.6, weight: 1.0 },
    { id: 'py_decorators', name: 'Decorators', difficulty: 0.8, weight: 0.8 },
    { id: 'py_generators', name: 'Generators', difficulty: 0.75, weight: 0.8 },
  ];

  const edges = [
    { from: 'py_variables', to: 'py_operators' },
    { from: 'py_variables', to: 'py_strings' },
    { from: 'py_operators', to: 'py_conditionals' },
    { from: 'py_conditionals', to: 'py_loops' },
    { from: 'py_variables', to: 'py_lists' },
    { from: 'py_loops', to: 'py_lists' },
    { from: 'py_lists', to: 'py_dicts' },
    { from: 'py_loops', to: 'py_functions' },
    { from: 'py_functions', to: 'py_scope' },
    { from: 'py_functions', to: 'py_modules' },
    { from: 'py_functions', to: 'py_files' },
    { from: 'py_functions', to: 'py_exceptions' },
    { from: 'py_functions', to: 'py_classes' },
    { from: 'py_classes', to: 'py_inheritance' },
    { from: 'py_loops', to: 'py_list_comp' },
    { from: 'py_functions', to: 'py_decorators' },
    { from: 'py_loops', to: 'py_generators' },
  ];

  return formatTemplate(nodes, edges);
}

/**
 * JavaScript template (abbreviated)
 */
function getJavaScriptTemplate() {
  const nodes = [
    { id: 'js_variables', name: 'Variables (let, const, var)', difficulty: 0.2, weight: 1.5 },
    { id: 'js_types', name: 'Data Types', difficulty: 0.25, weight: 1.2 },
    { id: 'js_operators', name: 'Operators', difficulty: 0.25, weight: 1.0 },
    { id: 'js_conditionals', name: 'Conditionals', difficulty: 0.35, weight: 1.3 },
    { id: 'js_loops', name: 'Loops', difficulty: 0.4, weight: 1.3 },
    { id: 'js_arrays', name: 'Arrays', difficulty: 0.4, weight: 1.5 },
    { id: 'js_objects', name: 'Objects', difficulty: 0.45, weight: 1.5 },
    { id: 'js_functions', name: 'Functions', difficulty: 0.5, weight: 1.8 },
    { id: 'js_arrow', name: 'Arrow Functions', difficulty: 0.55, weight: 1.0 },
    { id: 'js_callbacks', name: 'Callbacks', difficulty: 0.6, weight: 1.3 },
    { id: 'js_promises', name: 'Promises', difficulty: 0.7, weight: 1.5 },
    { id: 'js_async', name: 'Async/Await', difficulty: 0.75, weight: 1.5 },
    { id: 'js_dom', name: 'DOM Manipulation', difficulty: 0.6, weight: 1.2 },
    { id: 'js_events', name: 'Event Handling', difficulty: 0.65, weight: 1.2 },
    { id: 'js_classes', name: 'Classes', difficulty: 0.7, weight: 1.0 },
  ];

  const edges = [
    { from: 'js_variables', to: 'js_types' },
    { from: 'js_types', to: 'js_operators' },
    { from: 'js_operators', to: 'js_conditionals' },
    { from: 'js_conditionals', to: 'js_loops' },
    { from: 'js_variables', to: 'js_arrays' },
    { from: 'js_variables', to: 'js_objects' },
    { from: 'js_loops', to: 'js_functions' },
    { from: 'js_functions', to: 'js_arrow' },
    { from: 'js_functions', to: 'js_callbacks' },
    { from: 'js_callbacks', to: 'js_promises' },
    { from: 'js_promises', to: 'js_async' },
    { from: 'js_objects', to: 'js_dom' },
    { from: 'js_dom', to: 'js_events' },
    { from: 'js_functions', to: 'js_classes' },
  ];

  return formatTemplate(nodes, edges);
}

/**
 * Spanish language template (abbreviated)
 */
function getSpanishTemplate() {
  const nodes = [
    { id: 'sp_alphabet', name: 'Spanish Alphabet & Pronunciation', difficulty: 0.15, weight: 1.2 },
    { id: 'sp_greetings', name: 'Greetings & Introductions', difficulty: 0.2, weight: 1.5 },
    { id: 'sp_numbers', name: 'Numbers 1-100', difficulty: 0.25, weight: 1.0 },
    { id: 'sp_articles', name: 'Articles (el, la, un, una)', difficulty: 0.3, weight: 1.3 },
    { id: 'sp_nouns', name: 'Common Nouns & Gender', difficulty: 0.35, weight: 1.3 },
    { id: 'sp_adjectives', name: 'Adjectives & Agreement', difficulty: 0.4, weight: 1.2 },
    { id: 'sp_ser_estar', name: 'Ser vs Estar', difficulty: 0.5, weight: 1.8 },
    { id: 'sp_present', name: 'Present Tense Regular Verbs', difficulty: 0.45, weight: 1.5 },
    { id: 'sp_irregular', name: 'Common Irregular Verbs', difficulty: 0.55, weight: 1.3 },
    { id: 'sp_questions', name: 'Asking Questions', difficulty: 0.45, weight: 1.0 },
    { id: 'sp_time', name: 'Telling Time & Dates', difficulty: 0.4, weight: 1.0 },
    { id: 'sp_past', name: 'Past Tense (Pretérito)', difficulty: 0.6, weight: 1.5 },
    { id: 'sp_imperfect', name: 'Imperfect Tense', difficulty: 0.65, weight: 1.3 },
    { id: 'sp_future', name: 'Future Tense', difficulty: 0.55, weight: 1.2 },
    { id: 'sp_pronouns', name: 'Object Pronouns', difficulty: 0.6, weight: 1.2 },
  ];

  const edges = [
    { from: 'sp_alphabet', to: 'sp_greetings' },
    { from: 'sp_greetings', to: 'sp_numbers' },
    { from: 'sp_greetings', to: 'sp_articles' },
    { from: 'sp_articles', to: 'sp_nouns' },
    { from: 'sp_nouns', to: 'sp_adjectives' },
    { from: 'sp_articles', to: 'sp_ser_estar' },
    { from: 'sp_ser_estar', to: 'sp_present' },
    { from: 'sp_present', to: 'sp_irregular' },
    { from: 'sp_present', to: 'sp_questions' },
    { from: 'sp_numbers', to: 'sp_time' },
    { from: 'sp_present', to: 'sp_past' },
    { from: 'sp_past', to: 'sp_imperfect' },
    { from: 'sp_present', to: 'sp_future' },
    { from: 'sp_nouns', to: 'sp_pronouns' },
  ];

  return formatTemplate(nodes, edges);
}

/**
 * Format template nodes and edges with positions
 */
function formatTemplate(nodes, edges) {
  const nodesWithPositions = nodes.map((node, index) => ({
    node_id: node.id,
    name: node.name,
    description: node.description || `Learn ${node.name}`,
    difficulty: node.difficulty,
    weight: node.weight,
    misconceptions_library: node.misconceptions || [],
    prerequisites: edges.filter((e) => e.to === node.id).map((e) => e.from),
    position_x: (index % 5) * 150 + 50,
    position_y: Math.floor(index / 5) * 120 + 50,
  }));

  return {
    nodes: nodesWithPositions,
    edges: edges.map((e) => ({ from_node_id: e.from, to_node_id: e.to, type: 'prerequisite' })),
  };
}

/**
 * Fallback graph generation without AI
 */
function generateFallbackGraph(parsedIntent) {
  const keywords = parsedIntent.keywords || [];
  const title = parsedIntent.suggested_title || 'Learning Path';

  // Create simple linear graph from keywords
  const nodes = keywords.slice(0, 10).map((keyword, index) => ({
    node_id: `node_${index}`,
    name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    description: `Learn about ${keyword}`,
    difficulty: (index + 1) * 0.1,
    weight: 1.0,
    misconceptions_library: [],
    prerequisites: index > 0 ? [`node_${index - 1}`] : [],
    position_x: (index % 5) * 150 + 50,
    position_y: Math.floor(index / 5) * 120 + 50,
  }));

  const edges = nodes.slice(1).map((node, index) => ({
    from_node_id: `node_${index}`,
    to_node_id: node.node_id,
    type: 'prerequisite',
  }));

  return {
    nodes,
    edges,
    templateSource: 'fallback',
  };
}

export default generateGraph;
