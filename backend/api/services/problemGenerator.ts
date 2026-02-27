interface GenerateProblemsInput {
  difficulty: string;
  topic: string;
  count: number;
  generateStatements?: boolean;
  generateTestCases?: boolean;
  generateHints?: boolean;
}

export async function generateProblems(input: GenerateProblemsInput) {
  const difficulty = input.difficulty.toLowerCase();
  const topic = input.topic;

  return Array.from({ length: input.count }, (_, idx) => {
    const n = idx + 1;
    return {
      unique_id: `${difficulty}-${topic.toLowerCase()}-${Date.now()}-${n}`,
      title: `${topic} Practice ${n}`,
      slug: `${topic.toLowerCase().replace(/\s+/g, '-')}-practice-${n}`,
      difficulty,
      topic,
      statement: `Solve ${topic} practice problem ${n}.`,
      constraints: ['1 <= n <= 10^5'],
      mode: 'function',
      visibility: 'draft',
      tags: [topic],
      starter_code: {
        javascript: 'function solve(input) { return input; }',
        python: 'def solve(input):\n    return input',
        java: 'class Solution { Object solve(Object input) { return input; } }',
        c: 'int solve(int input) { return input; }',
        cpp: 'int solve(int input) { return input; }',
      },
      hints: input.generateHints
        ? ['Clarify constraints', 'Choose data structure', 'Optimize complexity']
        : [],
    };
  });
}
