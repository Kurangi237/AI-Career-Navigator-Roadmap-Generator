# 12-Week MNC DSA Interview Preparation Roadmap

## Overview
This roadmap is designed to take someone from DSA fundamentals to MNC interview-ready in 12 weeks. Adjust based on your current level and target company.

---

## PHASE 1: FOUNDATIONS (WEEK 1-2)
**Goal**: Build strong fundamentals for all advanced topics

### Week 1: Time Complexity & Basic Data Structures
**Time Investment**: 10-12 hours

#### Topics
- Time & Space Complexity Analysis
  - Big O notation (O(1), O(n), O(n²), O(log n), O(n log n))
  - Recognizing complexity in code
  - Why it matters in interviews

- Arrays & Lists
  - 1D and 2D arrays
  - Dynamic arrays/ArrayList
  - Indexing and slicing
  - Common operations and their complexity

- Strings
  - String basics and immutability
  - Character encoding
  - Common operations (substring, split, join)

#### Practice Problems (15 problems)
1. Two Sum - O(n) solution with hashmap
2. Best Time to Buy and Sell Stock - O(n) single pass
3. Valid Parentheses - O(n) with stack
4. Majority Element - O(n) with hashmap
5. Contains Duplicate - O(n) with set
6. Valid Anagram - O(n) with frequency map
7. Search Insert Position - O(log n) binary search
8. Remove Duplicates from Sorted Array - O(n) two pointers
9. Isomorphic Strings - O(n) with mapping
10. Happy Number - O(n) with set
11. Intersection of Two Arrays - O(n) with hashmap
12. Ransom Note - O(n) frequency counting
13. Reverse String - O(n) two pointers
14. First Unique Character - O(n) with hashmap
15. Move Zeroes - O(n) modification in place

#### Resources
- Algorithm Complexity: https://www.bigocheatsheet.com/
- LeetCode: Tag "Easy" in Array, String, HashMap
- Visualization: https://www.cs.usfca.edu/~galles/visualization/

---

### Week 2: Recursion, Backtracking & Stacks/Queues
**Time Investment**: 10-12 hours

#### Topics
- Recursion & Memoization
  - Base cases and recursive relation
  - Call stack visualization
  - Tail recursion vs regular recursion
  - Memoization pattern

- Backtracking
  - Decision tree pattern
  - Pruning unnecessary branches
  - Constraint satisfaction

- Stacks & Queues
  - LIFO (Last In First Out) principle
  - FIFO (First In First Out) principle
  - Implementation from scratch
  - Common patterns (monotonic stack, deque)

#### Practice Problems (15 problems)
1. Fibonacci Number - recursion + memoization
2. Climbing Stairs - recursion + memoization (DP intro)
3. Valid Parentheses - stack based solution
4. Merge Two Sorted Lists - recursion on lists
5. Permutations - backtracking decision tree
6. Combinations - backtracking with constraints
7. Palindrome Partitioning - backtracking combinations
8. N-Queens - backtracking with constraints
9. Daily Temperatures - monotonic stack
10. Evaluate Reverse Polish Notation - stack operations
11. Implement Queue using Stacks - dual stack pattern
12. Design Circular Queue - array implementation
13. Decode String - stack-based parsing
14. Number of Islands - DFS recursion
15. Subsets - iterative vs recursive backtracking

#### Resources
- Recursion Visualization: https://www.codingdrills.com/
- Backtracking: https://www.youtube.com/watch?v=YNOTJF5g2pI
- LeetCode: Tag "Recursion", "Stack", "Backtracking"

---

## PHASE 2: CORE DSA TOPICS (WEEK 3-8)
**Goal**: Master topics asked 70%+ in MNC interviews

### Week 3-4: Arrays & Strings (Advanced)
**Time Investment**: 15-20 hours total

#### Key Patterns
- **Sliding Window**
  - Fixed window size
  - Dynamic window size
  - When to use (consecutive subarray problems)

- **Two Pointers**
  - Same direction approach
  - Opposite direction (converging)
  - Use cases: pairs, triplets, partitioning

- **Prefix Sums**
  - Range queries optimization
  - 1D and 2D prefix sums
  - Subarray sum efficient calculation

#### Must-Solve Problems (40 problems)
**Sliding Window (8 problems)**
1. Maximum Subarray of Size K
2. Longest Substring Without Repeating Characters
3. Minimum Window Substring - Hard
4. Longest Repeating Character Replacement
5. Permutation in String
6. Fruit Into Baskets
7. Longest Substring with At Most K Distinct Characters
8. Max Consecutive Ones III

**Two Pointers (8 problems)**
1. Two Sum II - Input Array Is Sorted
2. 3Sum - classic problem
3. 3Sum Closest
4. Container With Most Water
5. Trapping Rain Water - Hard
6. Product of Array Except Self
7. Sort Colors (Dutch National Flag)
8. Valid Palindrome

**Prefix Sums & Subarrays (8 problems)**
1. Maximum Subarray (Kadane's Algorithm)
2. Range Sum Query Immutable
3. Subarray Sum Equals K - frequency map
4. Subarray Sums Divisible by K
5. Continuous Subarray Sum
6. Maximum Product Subarray
7. Max Sum of Rectangle No Larger Than K - Hard
8. Longest Well-Performing Interval

**Pattern Matching & Strings (8 problems)**
1. Longest Common Prefix
2. Valid Palindrome II - allow one deletion
3. Shortest Palindrome - KMP pattern
4. Longest Palindromic Subsequence - DP
5. Regular Expression Matching - DP Hard
6. Word Break - DP + HashSet
7. Implement strStr() - KMP or simple
8. Multiply Strings - simulation

**Other Array Strings (8 problems)**
1. Rotate Array - multiple approaches
2. Search in Rotated Sorted Array
3. Find the Duplicate Number
4. First Missing Positive - Hard
5. Median of Two Sorted Arrays - Hard
6. Set Matrix Zeroes
7. Spiral Matrix
8. Largest Rectangle in Histogram

#### Resources
- Sliding Window Masterclass: https://www.youtube.com/watch?v=MKG733xoH_U
- Two Pointers: https://www.youtube.com/watch?v=OnSSnKybYNU
- LeetCode: Filter by "Array", "String", sort by frequency

---

### Week 5-6: Trees & Graphs (Traversals & Searches)
**Time Investment**: 16-20 hours total

#### Key Topics
- **Tree Basics**
  - Properties and types
  - Depth vs. breadth
  - Tree representation in code

- **Tree Traversals**
  - DFS: Preorder, Inorder, Postorder
  - BFS: Level-order (using queue)
  - Morris Traversal (advanced)

- **Graph Basics**
  - Representation: Adjacency List vs Matrix
  - Directed vs Undirected graphs
  - Weighted vs Unweighted

- **Graph Traversals**
  - DFS with recursion and iteration
  - BFS with queue
  - Connectivity problems
  - Detection: cycles, bipartite, etc

- **Shortest Path Algorithms**
  - BFS (unweighted graphs)
  - Dijkstra's (weighted, non-negative)
  - Bellman-Ford (negative weights)
  - Floyd-Warshall (all pairs)

#### Must-Solve Problems (45 problems)
**Tree Traversals (8 problems)**
1. Binary Tree Preorder Traversal - iterative vs recursive
2. Binary Tree Inorder Traversal - iterative vs recursive
3. Binary Tree Postorder Traversal - iterative vs recursive
4. Level Order Traversal (Binary Tree Levelorder)
5. Vertical Order Traversal of Binary Tree - Hard
6. Binary Tree Right-Side View - BFS variant
7. Average of Levels in Binary Tree
8. Populating Next Right Pointers

**Tree Search Problems (9 problems)**
1. Validate Binary Search Tree
2. Search in a Binary Search Tree
3. Insert into a Binary Search Tree
4. Delete Node in a BST - Hard
5. Lowest Common Ancestor of BST
6. Lowest Common Ancestor of Binary Tree - Hard
7. Path in Zigzag Levelled Binary Tree
8. Closest Binary Search Tree Value
9. Kth Smallest Element in BST

**Binary Tree Path Problems (8 problems)**
1. Path Sum - simple DFS
2. Path Sum II - backtracking with path
3. Path Sum III - prefix sum on tree
4. Sum Root to Leaf Numbers
5. Binary Tree All Paths
6. Maximum Path Sum - Hard
7. Diameter of Binary Tree
8. Maximum Depth of Binary Tree

**Graph Representation & DFS/BFS (10 problems)**
1. Number of Islands - classic DFS
2. Surrounded Regions - DFS/BFS with marking
3. Clone Graph - DFS with hashmap
4. Course Schedule - topological sort + DFS (cycle detection)
5. Course Schedule II - topological sort with ordering
6. Alien Dictionary - topological sort with graph building - Hard
7. Graph Valid Tree - Union-Find or DFS
8. All Paths From Source to Target
9. Number of Connected Components
10. Can Reach Destination - directed graph BFS

**Shortest Path & Advanced Graph (10 problems)**
1. Shortest Path in Unweighted Graph - BFS
2. Path with Maximum Probability - Dijkstra's variant
3. Network Delay Time - Dijkstra's
4. Reachable Nodes With Restrictions - BFS
5. Minimum Cost to Make Network Connected - Union-Find count
6. Critical Connections - DFS bridge-finding
7. Word Ladder - BFS on implicit graph
8. Swim in Rising Water - Dijkstra's variant
9. Distance Between Bus Stops
10. Checkers in Chessboard - BFS with states

---

### Week 7: Dynamic Programming (Core Patterns)
**Time Investment**: 12-15 hours

#### DP Patterns & Approaches
1. **Unbounded Knapsack**: Coin Change variants, climbing stairs
2. **0/1 Knapsack**: Weight constraint, max value
3. **2D DP**: Matrix path problems
4. **String DP**: Edit distance, LCS, pattern matching
5. **Tree DP**: Maximum path sum on trees
6. **State Machine DP**: Stock trading variants
7. **Digit DP**: Numbers with digit constraints

#### Memoization vs Tabulation
- Top-down: Recursion + memo
- Bottom-up: Iteration with DP table

#### Must-Solve Problems (30 problems)
**1D DP Classics (8 problems)**
1. Climbing Stairs - fibonacci pattern
2. House Robber - linear DP
3. House Robber II - circular constraint
4. Decode Ways - string DP
5. Jump Game - greedy vs DP
6. Jump Game II - minimum jumps
7. Coin Change - unbounded knapsack
8. Coin Change II - counting combinations

**2D DP Matrix Problems (8 problems)**
1. Unique Paths - mathematical + DP
2. Unique Paths II - obstacles
3. Minimum Path Sum - grid optimization
4. Maximal Square - contiguous submatrix
5. Integer Break - product maximization
6. Largest Plus Sign - DP on grid
7. Largest Rectangle in Histogram - variation
8. Paint House - state machine DP

**String DP (6 problems)**
1. Longest Common Subsequence - classic
2. Edit Distance (Levenshtein) - transformations
3. Longest Increasing Subsequence - O(n log n)
4. Longest Palindromic Substring - expand around center
5. Regular Expression Matching - complex pattern
6. Word Break - linear DP

**Stock Trading DP (4 problems)**
1. Best Time to Buy Sell Stock - simple
2. Best Time to Buy Sell Stock II - unlimited
3. Best Time to Buy Sell Stock III - at most 2
4. Best Time to Buy Sell Stock IV - k transactions

**Advanced DP (4 problems)**
1. Interleaving String - 2D DP
2. Burst Balloons - interval DP
3. Distinct Subsequences - counting
4. Wildcard Matching - 2D DP pattern

#### DP Optimization Techniques
- Space optimization (rolling array)
- Time optimization (DFS + memo vs tabulation choice)
- Recognizing DP pattern in problems

---

### Week 8: Heaps, Tries & Advanced Structures
**Time Investment**: 12-14 hours

#### Topics
- **Heaps**
  - Min/Max heap implementation
  - Heapify operations
  - Heap sort
  - Applications: K-th element, median, scheduling

- **Tries (Prefix Trees)**
  - Trie structure and insertion
  - Search and prefix matching
  - Deletion
  - Applications: autocomplete, word lookup

- **Union-Find (Disjoint Set Union)**
  - Path compression and union by rank
  - Cycle detection
  - Connected components
  - Lowest common ancestor (LCA)

- **Segment Trees & Fenwick Trees** (Optional for FAANG)
  - Range queries optimization
  - Point updates
  - 2D variants

#### Must-Solve Problems (30 problems)
**Heap Problems (10 problems)**
1. Kth Largest Element - heap based
2. Top K Frequent Elements - heap + frequency
3. Find Median from Data Stream - two heaps
4. Reorganize String - greedy + heap
5. Merge K Sorted Lists - min heap
6. Ugly Number II - heap based generation
7. Task Scheduler - greedy + heap
8. Furthest Building - greedy + priority queue
9. Rearrange String - greedy constraint
10. Maximum Product - heap pop optimization

**Trie Problems (8 problems)**
1. Implement Trie - basic operations
2. Trie Autocomplete - prefix search
3. Word Search II - Trie + DFS combination
4. Implement Magic Dictionary - Trie variant
5. Concatenated Words - Trie + DP
6. Replace Words - Trie prefix
7. Shortest Word Distance III
8. Design Add and Search Words

**Union-Find Problems (8 problems)**
1. Number of Islands - UF approach
2. Smallest Set of Vertices - UF on edges
3. Graph Valid Tree - UF cycle detection
4. Minimum Cost to Connect All Cities - Kruskal with UF
5. Earliest Moment When Everyone Become Friends - UF variant
6. Sentence Similarity II - UF grouping
7. Number of Connected Components - UF counting
8. Accounts Merge - UF + HashMap grouping

**Advanced/Mixed (4 problems)**
1. Design Search Autocomplete System - Trie + Heap
2. Critical Connections in Network - DFS + Trie-like
3. Campus Bikes II - Dijkstra + optimization
4. Min Cost Connect All Points - Prim/Kruskal with UF

---

## PHASE 3: ADVANCED TOPICS & POLISH (WEEK 9-12)
**Goal**: Solve hard problems, company-specific focus, mock interviews

### Week 9: Bit Manipulation & Greedy
**Time Investment**: 8-10 hours

#### Bit Manipulation Patterns
- XOR tricks (swapping, finding unique)
- Bit counting and operations
- Subset generation
- Power of 2 detection

#### Greedy Patterns
- Activity/interval selection
- Huffman coding
- Job scheduling
- Matching problems

#### Must-Solve Problems (15 problems)
1. Single Number - XOR
2. Single Number II - bit counting
3. Majority Element - bit/map approach
4. Missing Number - XOR or math
5. Power of Two - bit trick
6. Number of 1 Bits - bit counting
7. Add Two Numbers - carry propagation
8. Jump Game - greedy movement
9. Interval Scheduling - greedy sort
10. Meeting Rooms II - greedy + heap
11. Task Scheduler - greedy + heap
12. Gas Station - greedy approach
13. Queue Reconstruction - clever sort + insert
14. Partition Labels - greedy interval
15. Minimum Window Substring - sliding window

---

### Week 10-11: Company-Specific Focus & Hard Problems
**Time Investment**: 20-25 hours

#### Pick your target company path:

**For Google/Meta Path (100+ problems solved total)**
- Focus: Arrays, Trees, Graphs, DP
- LeetCode: Filter "Google" or "Meta" and solved
- DO: 5-10 hard problems from their pool
- Example Hards: Trap Rain Water, Largest Rectangle, Serialize Tree

**For Amazon Path (80+ problems with system design)**
- Focus: Trees, Arrays, OOP Design
- LeetCode: Filter "Amazon" and most frequent
- DO: Deep dives on "Deep Dive" problems
- Example Hards: LRU Cache, Max Product Subarray, Design FileSystem

**For Apple Path (70+ with optimization focus)**
- Focus: Optimization, bit manipulation, memory efficiency
- LeetCode: Hard problems emphasizing space
- DO: Optimize every solution for space first
- Example Hards: Trapping Rain Water, Largest Rectangle

**For Goldman Sachs Path (120+ with heavy DP)**
- Focus: DP, Mathematics, Algorithms
- LeetCode: Hard DP problems, mathematical
- DO: 10-15 pure DP hard problems
- Example Hards: Edit Distance, Burst Balloons, Campus Bikes

#### Common Hard Problems All Should Know:
1. Median of Two Sorted Arrays
2. Regular Expression Matching
3. Trapping Rain Water
4. Merge K Sorted Lists
5. LRU Cache Design
6. Design Hit Counter
7. Serialize & Deserialize Binary Tree
8. Word Ladder II
9. Minimum Window Substring
10. Maximum Product Subarray

---

### Week 12: Mock Interviews & Final Review
**Time Investment**: 15-20 hours

#### Activities (by priority)
1. **Mock Interviews**: 3-5 full mock interviews
   - Use https://www.pramp.com/ (free peer mocking)
   - Use https://interviewing.io/ (paid but pro experience)
   - 60 minutes each minimum
   - Record and review your performance

2. **Weak Topic Revision**: 4-6 hours
   - List topics you struggled with in mocks
   - Revisit 5-10 key problems per weak topic
   - Focus on explanation, not just coding

3. **System Design** (for L4+): 4 hours
   - Design LRU Cache completely
   - Design Rate Limiter
   - Design Parking System
   - Focus on trade-offs and scaling

4. **Behavioral & Communication**: 2-3 hours
   - Practice 2-3 STAR method answers
   - Work through your resume projects
   - Practice technical communication

5. **Final Problem Marathon**: 3-5 hours
   - Solve 5-10 random mixed problems under time pressure
   - No hints, no lookups
   - Simulate interview stress

---

## Daily Schedule Template

### Week 1-2 (Foundation Phase)
- **1 hour**: Learn new concept (video + article)
- **1.5 hours**: Solve 3 problems on that concept
- **30 min**: Review solutions, understand approaches
- **30 min**: Analyze complexity, think of edge cases
- **3.5 hours total per day**

### Week 3-8 (Core Phase)
- **45 min**: Learn new pattern/technique
- **2 hours**: Solve 2-3 problems with pattern
- **1 hour**: Review and optimize solutions
- **1 hour**: Weak topic revision (last week's hard problems)
- **4.75 hours total per day**

### Week 9-10 (Advanced Phase)
- **30 min**: Topic deep dive (1 hard concept)
- **2 hours**: Solve 1-2 hard problems from target company
- **1 hour**: Think about alternative approaches
- **1 hour**: System design or communication practice
- **4.5 hours total per day**

### Week 11-12 (Polish Phase)
- **1 hour**: Weak topic practice
- **2 hours**: Solve 1-2 hard problems
- **1 hour**: Mock interview prep (review previous feedback)
- **1 hour**: Behavioral/communication practice
- **5 hours total per day** (or 2-3 mock interviews)

---

## Weekly Metrics to Track

### Time Investment
- Problems solved per week
- Time spent per problem (target: 15-20 mins on medium, 30-40 on hard)
- Acceptance rate on first attempt

### Quality Metrics
- Optimal solution rate (O(n) when possible)
- Time/space complexity accuracy
- Code cleanliness (naming, comments)
- Edge case handling

### Confidence Levels (Rate 1-10)
- Topic difficulty
- Implementation confidence
- Explanation clarity

---

## Resources Summary
- **LeetCode**: Primary platform (150-200 problems)
- **Pramp**: Free mock interviews
- **YouTube**: Tech interviews, algorithms
- **Books**: Cracking the Coding Interview, Elements of Programming Interviews
- **Company Blogs**: Google, Meta, Amazon research engineer blogs
