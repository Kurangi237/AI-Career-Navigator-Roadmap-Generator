import { CodingProblem, ProblemHintTier, ProblemSummary } from '@shared/types';
import { COMPANY_SHEETS, PROBLEM_BANK } from '../data/problemBank';
import { uuidv4 } from '../utils/uuid';

const TOTALS = { Easy: 927, Medium: 2010, Hard: 909 } as const;
const CUSTOM_KEY = 'KBV_custom_problems';

const TOPICS = ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Greedy', 'Backtracking', 'Math', 'Sliding Window', 'Stack'];

const TOPIC_SCENARIOS: Record<string, string[]> = {
  Arrays: [
    'Given an integer array, find indices that satisfy the condition using one pass.',
    'Compute a transformed array metric under strict time constraints.',
    'Return the best window or pair based on problem objective.',
  ],
  Strings: [
    'Process string characters with frequency constraints and return target measure.',
    'Find pattern relation between two strings using linear scan.',
    'Transform input string with minimal operations and output final state.',
  ],
  Trees: [
    'Traverse a binary tree and compute requested aggregate per node constraints.',
    'Validate tree property and return boolean or level order values.',
    'Find lowest common relation/path property between selected nodes.',
  ],
  Graphs: [
    'Given nodes and edges, compute reachability/count of connected components.',
    'Run BFS/DFS based traversal with visited-state optimization.',
    'Find shortest/valid path under weighted or unweighted constraints.',
  ],
  DP: [
    'Build DP state for optimal score over prefix/suffix transitions.',
    'Use memoization/tabulation to minimize operations or maximize value.',
    'Return total number of valid ways under modular arithmetic constraints.',
  ],
  Greedy: [
    'Pick locally optimal choices while proving global optimality.',
    'Sort by key metric and assign resources to maximize throughput.',
    'Minimize operations using interval/priority decision strategy.',
  ],
  Backtracking: [
    'Generate all valid combinations with pruning of invalid branches.',
    'Search solution space recursively with constraint checks.',
    'Return any valid arrangement or count all valid assignments.',
  ],
  Math: [
    'Apply arithmetic identities and bounds to derive result efficiently.',
    'Compute number-theory based output with edge-case handling.',
    'Return exact integer result for high input ranges.',
  ],
  'Sliding Window': [
    'Maintain dynamic window and update frequency map incrementally.',
    'Find maximum/minimum valid window that satisfies rule set.',
    'Track unique counts and return best window statistic.',
  ],
  Stack: [
    'Use monotonic stack to compute next greater/smaller relation.',
    'Validate sequence using stack push/pop constraints.',
    'Evaluate expression tokens with stack-based parsing.',
  ],
};

const generatedStatement = (summary: ProblemSummary, index: number): string => {
  const scenarios = TOPIC_SCENARIOS[summary.topic] || ['Solve the problem efficiently with optimal complexity.'];
  const scenario = scenarios[index % scenarios.length];
  const difficultyHint =
    summary.difficulty === 'Easy'
      ? 'Target O(n) time where possible.'
      : summary.difficulty === 'Medium'
      ? 'Aim for O(n) or O(n log n) with clean data-structure usage.'
      : 'Optimize for interview-grade performance and edge-case rigor.';

  return [
    `${summary.title}`,
    '',
    scenario,
    '',
    `Difficulty: ${summary.difficulty}`,
    `Topic: ${summary.topic}`,
    '',
    'Input format and output format must be handled exactly as specified by test cases.',
    difficultyHint,
  ].join('\n');
};

const readCustom = (): CodingProblem[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeCustom = (items: CodingProblem[]) => localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));

const catalogSummary = (difficulty: 'Easy' | 'Medium' | 'Hard', index: number): ProblemSummary => {
  const topic = TOPICS[index % TOPICS.length];
  return {
    id: `cat-${difficulty[0].toLowerCase()}-${index + 1}`,
    title: `${topic} Challenge ${index + 1}`,
    difficulty,
    topic,
    tags: [topic, 'Interview'],
    source: 'catalog',
  };
};

const makeGeneratedProblem = (summary: ProblemSummary): CodingProblem => {
  const base = PROBLEM_BANK[summary.difficulty === 'Hard' ? 2 : summary.difficulty === 'Medium' ? 1 : 0];
  const numericId = Number(summary.id.split('-').pop() || '1') - 1;
  return {
    ...base,
    id: summary.id,
    slug: summary.id,
    title: summary.title,
    topic: summary.topic,
    tags: summary.tags,
    statement: generatedStatement(summary, Math.max(0, numericId)),
  };
};

export const getProblemCountTargets = () => TOTALS;
export const getProblemCountLive = () => {
  const custom = readCustom();
  const customCounts = custom.reduce(
    (acc, p) => {
      acc[p.difficulty] += 1;
      return acc;
    },
    { Easy: 0, Medium: 0, Hard: 0 } as { Easy: number; Medium: number; Hard: number },
  );
  return {
    Easy: TOTALS.Easy + customCounts.Easy,
    Medium: TOTALS.Medium + customCounts.Medium,
    Hard: TOTALS.Hard + customCounts.Hard,
  };
};

export const listProblemSummaries = (opts: {
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'All';
  query?: string;
  page?: number;
  pageSize?: number;
  allowHard?: boolean;
}): { total: number; items: ProblemSummary[] } => {
  const { difficulty = 'All', query = '', page = 1, pageSize = 50, allowHard = true } = opts;
  const normalized = query.trim().toLowerCase();

  const all: ProblemSummary[] = [];
  (['Easy', 'Medium', 'Hard'] as const).forEach((d) => {
    if (difficulty !== 'All' && difficulty !== d) return;
    for (let i = 0; i < TOTALS[d]; i++) all.push(catalogSummary(d, i));
  });

  const custom = readCustom()
    .filter((p) => (difficulty === 'All' ? true : p.difficulty === difficulty))
    .map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      topic: p.topic,
      tags: p.tags,
      source: 'custom' as const,
    }));

  let merged = [...custom, ...all];
  if (normalized) {
    merged = merged.filter((x) => `${x.title} ${x.topic} ${x.tags.join(' ')}`.toLowerCase().includes(normalized));
  }

  const start = (page - 1) * pageSize;
  return { total: merged.length, items: merged.slice(start, start + pageSize) };
};

export const getProblemById = (id: string): CodingProblem | null => {
  const custom = readCustom().find((p) => p.id === id);
  if (custom) return custom;
  const seed = PROBLEM_BANK.find((p) => p.id === id);
  if (seed) return seed;

  const match = /^cat-([emh])-([0-9]+)$/.exec(id);
  if (!match) return null;
  const diffMap: Record<string, 'Easy' | 'Medium' | 'Hard'> = { e: 'Easy', m: 'Medium', h: 'Hard' };
  const difficulty = diffMap[match[1]];
  const idx = Math.max(0, Number(match[2]) - 1);
  return makeGeneratedProblem(catalogSummary(difficulty, idx));
};

export const createCustomProblem = (input: Omit<CodingProblem, 'id' | 'slug'>): CodingProblem => {
  const id = `custom-${uuidv4()}`;
  const problem: CodingProblem = {
    ...input,
    id,
    slug: id,
  };
  const all = readCustom();
  writeCustom([problem, ...all]);
  return problem;
};

export const updateCustomProblem = (problem: CodingProblem): void => {
  const all = readCustom().map((x) => (x.id === problem.id ? problem : x));
  writeCustom(all);
};

export const deleteCustomProblem = (id: string): void => {
  const all = readCustom().filter((x) => x.id !== id);
  writeCustom(all);
};

export const listCustomProblems = (): CodingProblem[] => readCustom();

export const listCompanySheets = () => COMPANY_SHEETS;

export const getHintTiers = (problem: CodingProblem): ProblemHintTier[] => {
  return [
    {
      tier: 1,
      label: 'Direction',
      content: `Focus on ${problem.topic}. Start with a brute-force baseline, then optimize with an index/map or window strategy.`,
    },
    {
      tier: 2,
      label: 'Structure',
      content: `Break input parsing first, then implement core logic in a helper loop. Validate edge cases from constraints.`,
    },
    {
      tier: 3,
      label: 'Final Hint',
      content: `Target ${problem.difficulty === 'Hard' ? 'O(n log n) or O(n)' : 'O(n)'} where possible. Re-check output format exactly.`,
    },
  ];
};

export const getPracticeAnswerTemplate = (problem: CodingProblem, language: 'javascript' | 'python' | 'java' | 'c' | 'cpp') => {
  if (language === 'javascript') {
    return `// Practice-only reference structure\n// Parse input -> apply ${problem.topic} strategy -> print output\n`;
  }
  if (language === 'python') {
    return `# Practice-only reference structure\n# Parse input -> apply ${problem.topic} strategy -> print output\n`;
  }
  if (language === 'java') {
    return `// Practice-only reference structure\n// Parse input -> apply ${problem.topic} strategy -> print output\n`;
  }
  if (language === 'c') {
    return `/* Practice-only reference structure */\n/* Parse input -> apply ${problem.topic} strategy -> print output */\n`;
  }
  return `// Practice-only reference structure\n// Parse input -> apply ${problem.topic} strategy -> print output\n`;
};

export const generateDailySheetFromWeakTopics = (
  weakTopics: string[],
  count: number,
  allowHard: boolean,
): ProblemSummary[] => {
  const topics = weakTopics.length ? weakTopics : TOPICS.slice(0, 3);
  const out: ProblemSummary[] = [];
  let idx = 1;
  while (out.length < count) {
    const topic = topics[out.length % topics.length];
    const diff: 'Easy' | 'Medium' | 'Hard' =
      out.length % 5 === 0 ? 'Easy' : out.length % 5 === 4 ? 'Hard' : 'Medium';
    if (!allowHard && diff === 'Hard') {
      out.push(catalogSummary('Medium', idx++));
      continue;
    }
    out.push({
      id: `cat-${diff[0].toLowerCase()}-${idx++}`,
      title: `${topic} Daily Drill ${idx}`,
      difficulty: diff,
      topic,
      tags: [topic, 'Daily Sheet'],
      source: 'catalog',
    });
  }
  return out;
};

