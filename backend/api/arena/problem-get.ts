import { getAdminClient } from '../../lib/database';

const defaultStarterCode = {
  javascript: 'function solve(input) {\n  return input;\n}',
  python: 'def solve(input):\n    return input',
  java: 'class Solution {\n  public Object solve(Object input) {\n    return input;\n  }\n}',
  c: 'int solve(int input) {\n  return input;\n}',
  cpp: 'int solve(int input) {\n  return input;\n}',
};

export default async function handler(req: any, res: any) {
  try {
    const id = `${req.query?.id || req.body?.id || ''}`.trim();
    if (!id) return res.status(400).json({ error: 'Missing problem id' });

    const client = getAdminClient();
    const { data: problem, error: problemError } = await client
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();

    if (problemError || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { data: testCases, error: testCaseError } = await client
      .from('test_cases')
      .select('input, expected_output, explanation, order')
      .eq('problem_id', id)
      .order('order', { ascending: true });

    if (testCaseError) throw testCaseError;

    return res.status(200).json({
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      topic: problem.topic,
      tags: Array.isArray(problem.tags) ? problem.tags : [],
      statement: problem.statement || '',
      constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
      mode: problem.mode || 'function',
      functionName: problem.function_name || 'solve',
      starterCode: { ...defaultStarterCode, ...(problem.starter_code || {}) },
      testCases: (testCases || []).map((tc: any) => ({
        input: Array.isArray(tc.input) ? tc.input : [tc.input],
        expected: tc.expected_output,
        explanation: tc.explanation || '',
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to get problem' });
  }
}
