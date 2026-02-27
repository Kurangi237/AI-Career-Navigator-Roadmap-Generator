/**
 * Problem Generation Admin API
 * Generate problems programmatically with AI assistance
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../../../lib/database';

const router = Router();

/**
 * Generate problems for a specific topic/difficulty
 * POST /api/admin/problems/generate
 * Body: { difficulty: 'easy', topic: 'Arrays', count: 10 }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { difficulty, topic, count = 10 } = req.body;

    if (!difficulty || !topic || count > 100) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Call problem generator (in separate service)
    const { generateProblems } = await import('../../services/problemGenerator');

    const newProblems = await generateProblems({
      difficulty,
      topic,
      count,
      generateStatements: true,
      generateTestCases: true,
      generateHints: true,
    });

    // Insert into database
    const { data, error } = await supabase
      .from('problems')
      .insert(newProblems)
      .select();

    if (error) throw error;

    res.json({
      generated: data.length,
      problems: data,
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Failed to generate problems' });
  }
});

/**
 * Generate hints for a problem
 * POST /api/admin/problems/:problemId/hints
 */
router.post('/:problemId/hints', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    // Get problem details
    const { data: problem, error: fetchError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (fetchError) throw fetchError;

    // Generate hints (placeholder - would use OpenAI/Claude API)
    const hints = [
      'Think about the data structure you need to use',
      'Consider the constraints and time complexity',
      'Write example code for a simple case first',
    ];

    res.json({ hints });
  } catch (err) {
    console.error('Hint generation error:', err);
    res.status(500).json({ error: 'Failed to generate hints' });
  }
});

/**
 * Auto-complete starter code for a problem
 * POST /api/admin/problems/:problemId/autocomplete-code
 * Body: { language: 'javascript' }
 */
router.post('/:problemId/autocomplete-code', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const { language } = req.body;

    const { data: problem, error: fetchError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (fetchError) throw fetchError;

    // Generate starter code template (placeholder)
    const starterCodes: Record<string, string> = {
      javascript: `function solve(input) {
  // TODO: Implement solution
  return result;
}`,
      python: `def solve(input):
    # TODO: Implement solution
    return result`,
      java: `public class Solution {
    public Object solve(String input) {
        // TODO: Implement solution
        return result;
    }
}`,
      c: `#include <stdio.h>\n\nint main() {\n    // TODO: Implement solution\n    return 0;\n}`,
      cpp: `#include <iostream>\n\nint main() {\n    // TODO: Implement solution\n    return 0;\n}`,
    };

    const code = starterCodes[language] || '';

    // Update problem
    const { data, error } = await supabase
      .from('problems')
      .update({
        starter_code: {
          ...problem.starter_code,
          [language]: code,
        },
      })
      .eq('id', problemId)
      .select()
      .single();

    if (error) throw error;

    res.json({ problem: data });
  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

/**
 * List generated problems by user
 * GET /api/admin/problems/generated
 */
router.get('/generated', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ problems: data });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Failed to list problems' });
  }
});

export default router;
