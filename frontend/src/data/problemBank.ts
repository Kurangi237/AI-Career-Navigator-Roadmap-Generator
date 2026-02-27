import { CodingProblem, CompanySheet } from '@shared/types';

export const PROBLEM_BANK: CodingProblem[] = [
  {
    id: 'p-001',
    title: 'Two Sum (Indices)',
    slug: 'two-sum-indices',
    difficulty: 'Easy',
    topic: 'Arrays',
    tags: ['Array', 'Hash Map'],
    statement:
      'Input: first line n, second line n integers, third line target. Output two indices (0-based) in ascending order.',
    constraints: ['2 <= n <= 1e5', 'Exactly one valid answer exists.'],
    mode: 'stdin',
    starterCode: {
      javascript: `const fs = require('fs');
const data = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);
let idx = 0;
const n = data[idx++];
const arr = data.slice(idx, idx + n); idx += n;
const target = data[idx++];
// TODO: implement using HashMap
// print two indices (i j)
console.log('0 1');`,
      python: `import sys
data = list(map(int, sys.stdin.read().strip().split()))
i = 0
n = data[i]; i += 1
arr = data[i:i+n]; i += n
target = data[i]
# TODO: implement using dictionary
print(0, 1)`,
      java: `import java.io.*;
import java.util.*;
public class Main {
  public static void main(String[] args) throws Exception {
    FastScanner fs = new FastScanner(System.in);
    int n = fs.nextInt();
    int[] arr = new int[n];
    for (int i = 0; i < n; i++) arr[i] = fs.nextInt();
    int target = fs.nextInt();
    // TODO: implement using HashMap
    System.out.println("0 1");
  }
  static class FastScanner {
    private final InputStream in;
    private final byte[] buffer = new byte[1 << 16];
    private int ptr = 0, len = 0;
    FastScanner(InputStream is) { in = is; }
    private int read() throws IOException {
      if (ptr >= len) { len = in.read(buffer); ptr = 0; if (len <= 0) return -1; }
      return buffer[ptr++];
    }
    int nextInt() throws IOException {
      int c; do { c = read(); } while (c <= ' ' && c != -1);
      int sign = 1; if (c == '-') { sign = -1; c = read(); }
      int val = 0; while (c > ' ') { val = val * 10 + (c - '0'); c = read(); }
      return val * sign;
    }
  }
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
typedef struct { int key, val, used; } Node;
int main() {
  int n; if (scanf("%d", &n) != 1) return 0;
  int *a = (int*)malloc(sizeof(int) * n);
  for (int i = 0; i < n; i++) scanf("%d", &a[i]);
  int target; scanf("%d", &target);
  // TODO: implement hash table solution
  printf("0 1\\n");
  free(a); return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  int n; if (!(cin >> n)) return 0;
  vector<int> a(n);
  for (int i = 0; i < n; i++) cin >> a[i];
  int target; cin >> target;
  // TODO: implement using unordered_map
  cout << "0 1\\n";
}`,
    },
    testCases: [
      { input: ['4\n2 7 11 15\n9\n'], expected: '0 1' },
      { input: ['3\n3 2 4\n6\n'], expected: '1 2' },
    ],
  },
  {
    id: 'p-002',
    title: 'Longest Unique Substring Length',
    slug: 'longest-unique-substring-length',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    tags: ['String', 'Two Pointers'],
    statement: 'Input single string s. Output length of the longest substring with all unique characters.',
    constraints: ['0 <= |s| <= 1e5'],
    mode: 'stdin',
    starterCode: {
      javascript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf8').trim();
// TODO: sliding window solution
console.log(0);`,
      python: `import sys
s = sys.stdin.read().strip()
# TODO: sliding window solution
print(0)`,
      java: `import java.io.*;
import java.util.*;
public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    String s = br.readLine();
    if (s == null) s = "";
    // TODO: sliding window solution
    System.out.println(0);
  }
}`,
      c: `#include <stdio.h>
#include <string.h>
int main() {
  char s[200005];
  if (!fgets(s, sizeof(s), stdin)) { printf("0\\n"); return 0; }
  int n = strlen(s);
  if (n > 0 && s[n-1] == '\\n') s[--n] = 0;
  // TODO: sliding window solution
  printf("0\\n");
  return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  string s; getline(cin, s);
  // TODO: sliding window solution
  cout << 0 << "\\n";
}`,
    },
    testCases: [
      { input: ['abcabcbb\n'], expected: '3' },
      { input: ['bbbbb\n'], expected: '1' },
      { input: ['pwwkew\n'], expected: '3' },
    ],
  },
  {
    id: 'p-003',
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Hard',
    topic: 'Graphs',
    tags: ['DFS', 'BFS', 'Matrix'],
    statement:
      'Input: r c then r lines of 0/1 grid. Output count of islands (4-direction connected components of 1s).',
    constraints: ['1 <= r,c <= 300'],
    mode: 'stdin',
    starterCode: {
      javascript: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split(/\\n/).map(x => x.trim());
if (!lines.length) { console.log(0); process.exit(0); }
const [r, c] = lines[0].split(/\\s+/).map(Number);
const g = [];
for (let i = 1; i <= r; i++) g.push(lines[i].split(/\\s+/).map(Number));
// TODO: DFS/BFS component count
console.log(0);`,
      python: `import sys
data = sys.stdin.read().strip().splitlines()
if not data:
    print(0); raise SystemExit
r, c = map(int, data[0].split())
g = [list(map(int, data[i+1].split())) for i in range(r)]
# TODO: DFS/BFS component count
print(0)`,
      java: `import java.io.*;
import java.util.*;
public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    String first = br.readLine();
    if (first == null || first.trim().isEmpty()) { System.out.println(0); return; }
    StringTokenizer st = new StringTokenizer(first);
    int r = Integer.parseInt(st.nextToken()), c = Integer.parseInt(st.nextToken());
    int[][] g = new int[r][c];
    for (int i = 0; i < r; i++) {
      st = new StringTokenizer(br.readLine());
      for (int j = 0; j < c; j++) g[i][j] = Integer.parseInt(st.nextToken());
    }
    // TODO: DFS/BFS component count
    System.out.println(0);
  }
}`,
      c: `#include <stdio.h>
int g[305][305], qx[100000], qy[100000];
int main() {
  int r, c; if (scanf("%d %d", &r, &c) != 2) { printf("0\\n"); return 0; }
  for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) scanf("%d", &g[i][j]);
  // TODO: DFS/BFS component count
  printf("0\\n");
  return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  int r, c; if (!(cin >> r >> c)) { cout << 0 << "\\n"; return 0; }
  vector<vector<int>> g(r, vector<int>(c));
  for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> g[i][j];
  // TODO: DFS/BFS component count
  cout << 0 << "\\n";
}`,
    },
    testCases: [
      { input: ['3 3\n1 1 0\n1 0 0\n0 0 1\n'], expected: '2' },
      { input: ['3 3\n1 1 1\n0 1 0\n1 1 1\n'], expected: '1' },
    ],
  },
];

export const COMPANY_SHEETS: CompanySheet[] = [
  { id: 'sheet-amz', company: 'Amazon', roleTrack: 'SDE Interview', problemIds: ['p-001', 'cat-m-21', 'cat-m-48', 'cat-h-12'] },
  { id: 'sheet-goo', company: 'Google', roleTrack: 'Software Engineer', problemIds: ['p-002', 'cat-m-33', 'cat-h-29', 'cat-m-63'] },
  { id: 'sheet-ms', company: 'Microsoft', roleTrack: 'SDE II', problemIds: ['p-001', 'cat-e-19', 'cat-m-14', 'cat-h-8'] },
  { id: 'sheet-meta', company: 'Meta', roleTrack: 'Production Engineer', problemIds: ['p-003', 'cat-m-41', 'cat-m-77', 'cat-h-18'] },
  { id: 'sheet-apple', company: 'Apple', roleTrack: 'Core Platform', problemIds: ['p-002', 'cat-m-95', 'cat-h-31', 'cat-e-54'] },
  { id: 'sheet-netflix', company: 'Netflix', roleTrack: 'Backend Infra', problemIds: ['p-003', 'cat-h-22', 'cat-m-120', 'cat-m-142'] },
  { id: 'sheet-adobe', company: 'Adobe', roleTrack: 'Member of Technical Staff', problemIds: ['p-001', 'cat-e-80', 'cat-m-160', 'cat-h-40'] },
  { id: 'sheet-salesforce', company: 'Salesforce', roleTrack: 'Software Engineer', problemIds: ['p-002', 'cat-m-185', 'cat-e-112', 'cat-h-51'] },
  { id: 'sheet-oracle', company: 'Oracle', roleTrack: 'Cloud Engineer', problemIds: ['p-001', 'cat-m-201', 'cat-m-218', 'cat-h-66'] },
  { id: 'sheet-intel', company: 'Intel', roleTrack: 'Systems Engineer', problemIds: ['p-003', 'cat-m-233', 'cat-e-150', 'cat-h-72'] },
];
