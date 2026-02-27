/**
 * Problem Generator for Coding Arena
 * Generates 3,846 realistic LeetCode-style problems
 * Distribution: 927 Easy, 2,010 Medium, 909 Hard
 */

interface GeneratedProblem {
  unique_id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  statement: string;
  constraints: string[];
  mode: 'function' | 'stdin';
  starter_code: {
    javascript: string;
    python: string;
    java: string;
    c: string;
    cpp: string;
  };
  function_name: string;
}

// Problem template categories
const TOPICS = {
  Easy: [
    'Arrays',
    'Strings',
    'Hash Maps',
    'Math',
    'Two Pointers',
    'Stacks',
    'Queues',
    'Sorting',
    'Searching',
    'Bit Manipulation',
  ],
  Medium: [
    'Arrays',
    'Strings',
    'Hash Maps',
    'Linked Lists',
    'Trees',
    'Graphs',
    'Dynamic Programming',
    'Greedy',
    'Backtracking',
    'BFS/DFS',
  ],
  Hard: [
    'Arrays',
    'Dynamic Programming',
    'Graphs',
    'Trees',
    'Advanced Algorithms',
    'System Design',
    'Bit Manipulation',
    'Sliding Window',
    'Union Find',
    'Tries',
  ],
};

const COMPANIES = [
  'Amazon',
  'Google',
  'Microsoft',
  'Meta',
  'Apple',
  'Netflix',
  'Tesla',
  'Adobe',
  'Oracle',
  'Intel',
  'Nvidia',
  'IBM',
  'Uber',
  'Airbnb',
  'LinkedIn',
  'Twitter',
  'Dropbox',
  'Slack',
  'Square',
  'Pinterest',
  'Lyft',
  'Snapchat',
  'Bloomberg',
  'PayPal',
  'Zoom',
];

// Problem title templates by topic
const PROBLEM_TEMPLATES: Record<string, string[]> = {
  'Arrays': [
    'Find Maximum Subarray Sum',
    'Search in Rotated Array',
    'Merge Sorted Arrays',
    'Find Duplicate',
    'Remove Duplicates',
    'Move Zeroes',
    'Rotate Array',
    'Contains Duplicate',
    'Intersection of Two Arrays',
    'Best Time to Buy Stock',
  ],
  'Strings': [
    'Longest Substring Without Repeating',
    'Palindrome Substrings',
    'Word Break',
    'Valid Parentheses',
    'Reverse String',
    'Group Anagrams',
    'String Compression',
    'ZigZag Conversion',
    'Integer to Roman',
    'Regular Expression Matching',
  ],
  'Graphs': [
    'Number of Islands',
    'Topological Sort',
    'Course Schedule',
    'Alien Dictionary',
    'Word Ladder',
    'Clone Graph',
    'Pacific Atlantic Water Flow',
    'Surrounded Regions',
    'Network Delay Time',
    'Critical Connections',
  ],
  'Dynamic Programming': [
    'Maximum Subarray',
    'Coin Change',
    'Longest Increasing Subsequence',
    'Word Break II',
    'Burst Balloons',
    'Edit Distance',
    'House Robber',
    'Interleaving String',
    'Minimum Path Sum',
    'Max Points on Line',
  ],
  'Bit Manipulation': [
    'Single Number',
    'Number of 1 Bits',
    'Counting Bits',
    'Reverse Bits',
    'Power of Two',
    'Missing Number',
    'Bitwise AND Range',
    'UTF-8 Validation',
    'Single Number III',
    'Integer to English Words',
  ],
  'Trees': [
    'Binary Tree Level Order Traversal',
    'Lowest Common Ancestor',
    'Validate Binary Search Tree',
    'Serialize Deserialize Binary Tree',
    'Path Sum',
    'Invert Binary Tree',
    'Maximum Path Sum',
    'Binary Tree Right Side View',
    'Vertical Order Traversal',
    'Binary Search Tree Iterator',
  ],
};

const STARTER_CODE_TEMPLATES = {
  javascript: {
    function: `/**
 * @param {type[]} param - description
 * @return {type}
 */
var solution = function(param) {
    // TODO: implement solution
    return null;
};`,
    stdin: `const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let input = [];
rl.on('line', (line) => {
  input.push(line);
});

rl.on('close', () => {
  // TODO: parse input and solve
  console.log('result');
});`,
  },
  python: {
    function: `def solution(param):
    \"\"\"
    :type param: type
    :rtype: type
    \"\"\"
    # TODO: implement solution
    return None`,
    stdin: `import sys
data = sys.stdin.read().strip().split('\\n')
# TODO: parse input and solve
print('result')`,
  },
  java: {
    function: `class Solution {
    public type solution(type param) {
        // TODO: implement solution
        return null;
    }
}`,
    stdin: `import java.io.*;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // TODO: parse input and solve
        System.out.println("result");
    }
}`,
  },
  c: {
    function: `// TODO: implement solution
return 0;`,
    stdin: `#include <stdio.h>

int main() {
    // TODO: parse input and solve
    printf("result\\n");
    return 0;
}`,
  },
  cpp: {
    function: `// TODO: implement solution
return 0;`,
    stdin: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: parse input and solve
    cout << "result\\n";
    return 0;
}`,
  },
};

class ProblemGenerator {
  /**
   * Generate all 3,846 problems
   */
  generateAllProblems(): GeneratedProblem[] {
    const problems: GeneratedProblem[] = [];
    let idCounter = 1;

    // Generate Easy problems (927)
    const easyProblems = this.generateProblemsByDifficulty('Easy', 927);
    problems.push(
      ...easyProblems.map((p, i) => ({
        ...p,
        unique_id: `p-easy-${idCounter++}`,
      }))
    );

    // Generate Medium problems (2,010)
    const mediumProblems = this.generateProblemsByDifficulty('Medium', 2010);
    problems.push(
      ...mediumProblems.map((p) => ({
        ...p,
        unique_id: `p-med-${idCounter++}`,
      }))
    );

    // Generate Hard problems (909)
    const hardProblems = this.generateProblemsByDifficulty('Hard', 909);
    problems.push(
      ...hardProblems.map((p) => ({
        ...p,
        unique_id: `p-hard-${idCounter++}`,
      }))
    );

    return problems;
  }

  /**
   * Generate problems for a specific difficulty
   */
  private generateProblemsByDifficulty(
    difficulty: 'Easy' | 'Medium' | 'Hard',
    count: number
  ): GeneratedProblem[] {
    const problems: GeneratedProblem[] = [];
    const topics = TOPICS[difficulty];
    const problemsPerTopic = Math.floor(count / topics.length);
    const remainder = count % topics.length;

    let problemIndex = 1;

    for (let topicIdx = 0; topicIdx < topics.length; topicIdx++) {
      const topic = topics[topicIdx];
      const topicCount = problemsPerTopic + (topicIdx < remainder ? 1 : 0);

      for (let i = 0; i < topicCount; i++) {
        const problem = this.generateSingleProblem(
          difficulty,
          topic,
          `${difficulty.toLowerCase()}-${topic.replace(/\s+/g, '-')}-${i + 1}`,
          problemIndex++
        );
        problems.push(problem);
      }
    }

    return problems;
  }

  /**
   * Generate a single problem
   */
  private generateSingleProblem(
    difficulty: 'Easy' | 'Medium' | 'Hard',
    topic: string,
    slug: string,
    index: number
  ): GeneratedProblem {
    const titles = PROBLEM_TEMPLATES[topic] || [`Problem ${index}`];
    const title = titles[index % titles.length];

    const constraints = this.generateConstraints(difficulty, topic);
    const statement = this.generateProblemStatement(title, topic, difficulty);
    const mode: 'function' | 'stdin' = index % 3 === 0 ? 'function' : 'stdin';

    return {
      unique_id: '', // Will be set by caller
      title,
      slug,
      difficulty,
      topic,
      tags: this.generateTags(topic, difficulty),
      statement,
      constraints,
      mode,
      starter_code: this.generateStarterCode(mode),
      function_name: 'solution',
    };
  }

  /**
   * Generate problem statement
   */
  private generateProblemStatement(title: string, topic: string, difficulty: string): string {
    return `## ${title}

### Description
You are given a problem related to ${topic}. Your task is to implement an efficient solution.

### Example
\`\`\`
Input: example
Output: expected_output
Explanation: explanation of the example
\`\`\`

### Constraints
- Time Complexity: O(n) or better
- Space Complexity: O(n) or better
- Difficulty Level: ${difficulty}`;
  }

  /**
   * Generate constraints
   */
  private generateConstraints(difficulty: string, topic: string): string[] {
    const baseConstraints = ['1 <= n <= 10^5', 'Values are within 32-bit integer range'];

    if (difficulty === 'Easy') {
      return [...baseConstraints, 'No duplicate elements', 'Array is sorted'];
    } else if (difficulty === 'Medium') {
      return [...baseConstraints, 'Can have duplicate elements', 'May require optimization'];
    } else {
      return [...baseConstraints, 'Requires advanced algorithmic thinking', 'Time limit: 2 seconds'];
    }
  }

  /**
   * Generate tags for a problem
   */
  private generateTags(topic: string, difficulty: string): string[] {
    const baseTags: string[] = [topic];

    if (difficulty === 'Easy') {
      baseTags.push('Beginner-Friendly', 'Array');
    } else if (difficulty === 'Medium') {
      baseTags.push('Optimization', 'Intermediate');
    } else {
      baseTags.push('Advanced', 'Algorithmic');
    }

    // Add random company tags
    const companyTags = COMPANIES.slice(0, Math.floor(Math.random() * 5) + 1);
    baseTags.push(...companyTags);

    return baseTags;
  }

  /**
   * Generate starter code for all languages
   */
  private generateStarterCode(mode: 'function' | 'stdin') {
    return {
      javascript: STARTER_CODE_TEMPLATES.javascript[mode],
      python: STARTER_CODE_TEMPLATES.python[mode],
      java: STARTER_CODE_TEMPLATES.java[mode],
      c: STARTER_CODE_TEMPLATES.c[mode],
      cpp: STARTER_CODE_TEMPLATES.cpp[mode],
    };
  }
}

// Export for use in scripts
export const problemGenerator = new ProblemGenerator();
export default problemGenerator;
