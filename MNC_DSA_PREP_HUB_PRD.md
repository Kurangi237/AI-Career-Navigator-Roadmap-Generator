# MNC DSA Interview Preparation Platform - PRD

## 1. Product Overview
- **Product Name**: `MNC DSA Prep Hub` (AI Career Navigator - DSA Module)
- **Category**: Top MNC Companies Coding Interview Preparation Platform
- **Target Users**: Job seekers, engineering students, career switchers preparing for MNC interviews
- **Mission**: Help users crack coding interviews at top tech companies (Google, Meta, Amazon, Microsoft, Apple, etc.)

## 2. Objectives
- Provide company-specific DSA problem collections and interview patterns.
- Structured learning path from fundamentals to company-specific challenges.
- Real interview simulation with timed coding challenges matching actual interview formats.
- Track progress and identify weak areas in specific DSA topics.
- Provide resources, tips, and strategies for each company's interview process.

## 3. Core Modules
- **DSA Topic Mastery**: Organized by data structure and algorithm type
- **Company-Specific Paths**: Curated problem sets for each MNC
- **Adaptive Practice**: Personalized recommendations based on performance
- **Interview Simulations**: Timed contests matching actual interview conditions
- **Progress Tracking**: Topic-wise and company-wise progress dashboard
- **Resource Hub**: Interview guides, tips, templates, and preparation strategies
- **Discussion Forum**: Community solutions and approach discussions

## 4. Supported Top MNC Companies
1. **Google**: Arrays, Strings, Hash Tables, Trees, Graphs, Dynamic Programming
2. **Meta (Facebook)**: Interview patterns, coding problems, system design basics
3. **Amazon**: Object-oriented design, Trees, Arrays, Strings, Graphs
4. **Microsoft**: Azure, Cloud, Arrays, Strings, Trees, Graphs
5. **Apple**: Low-level systems, Memory, Hardware, Data Structures
6. **Uber**: Graphs (especially ride-matching), Heaps, Hash Tables
7. **Goldman Sachs**: Complex algorithms, Finance-specific DSA
8. **McKinsey/Consulting**: Logic, Puzzles, Problem-solving patterns

## 5. DSA Topics Covered (Fundamental to Advanced)
### Foundation (Week 1-2)
- Time & Space Complexity Analysis
- Basic Data Structures (Arrays, Linked Lists, Stacks, Queues)
- Recursion and Backtracking basics

### Core Topics (Week 3-8)
1. **Arrays & Strings**
   - Two pointers, Sliding window, Prefix sums
   - Pattern matching, Substring problems

2. **Hash Tables & Sets**
   - Collision handling, Hash functions
   - Frequency counting, Tracking problems

3. **Linked Lists**
   - Reversal, Merging, Cycle detection
   - Slow-fast pointers

4. **Stacks & Queues**
   - Monotonic stacks, Parenthesis matching
   - Queue-based BFS

5. **Trees & Graphs**
   - Tree traversals (DFS, BFS, Level-order)
   - Binary Search Trees, Balanced trees
   - Shortest path algorithms (Dijkstra, BFS)
   - Union-Find, Topological sort
   - Graph coloring, Bipartite checking

6. **Dynamic Programming**
   - Memoization vs Tabulation
   - Common patterns: LIS, LCS, Knapsack, Path problems
   - DP state transitions

### Advanced Topics (Week 8-12)
7. **Heaps & Priority Queues**
   - Min/Max heaps, Heap building
   - K-th largest, Median finding

8. **Tries & String Algorithms**
   - Prefix trees, Word search
   - KMP, Rabin-Karp, Z-algorithm

9. **Advanced Graph Algorithms**
   - Floyd-Warshall, Bellman-Ford
   - Strongly connected components, Bridges
   - Minimum spanning tree (Kruskal, Prim)

10. **Bit Manipulation**
    - Bit operations, XOR tricks
    - Subset generation, Power of 2 problems

11. **Segment Trees & Fenwick Trees**
    - Range queries, Point updates
    - 2D variants

12. **Greedy & Interval Problems**
    - Activity selection, Interval scheduling
    - Huffman coding

## 6. Difficulty & Learning Path System
- **Beginner (Green)**: 0-100 LeetCode Easy equivalent, Fundamentals focus
- **Intermediate (Yellow)**: 100-300 LeetCode Easy/Medium equivalent, Interview-ready
- **Advanced (Red)**: 300+ LeetCode Medium/Hard equivalent, FAANG-level preparation
- **Algorithm**: Score = (Completion % × 0.4) + (Accuracy % × 0.4) + (Speed Benchmark × 0.2)

## 7. Company-Specific Interview Patterns

### Company Interview Formats:
- **Google**: 4-5 rounds of DSA-heavy coding (45-60 min each), focus on optimization
- **Meta**: 2-3 DSA coding rounds, System design for senior roles
- **Amazon**: Deep dive + Leadership principles combined with DSA
- **Microsoft**: Coding rounds + Azure product knowledge
- **Apple**: Hardware awareness in algorithm design

## 8. Functional Requirements
- FR1: Company-specific problem recommendation engine
- FR2: Topic-wise mastery verification with interactive lessons
- FR3: Timed mock interview simulations matching company patterns
- FR4: Adaptive learning based on performance analytics
- FR5: Resource library with company-specific tips and interview experiences
- FR6: Community discussion forum for solutions and approaches
- FR7: Blind interview-style progress tracking (anonymous submissions)
- FR8: Interview preparation timeline (8-12 week roadmap)

## 9. Non-Functional Requirements
- Secure sandboxed code execution (Docker isolation)
- API response time p95 under 2 seconds
- Support 10+ programming languages
- Mobile-optimized for on-the-go practice
- Real-time progress syncing across devices
- GDPR/privacy-compliant (anonymous option)

## 10. Interview Preparation Timeline
- **Week 1-2**: Foundation building (Complexity, Basic data structures)
- **Week 3-5**: Core DSA topics (Arrays, Strings, Hash tables, Linked Lists)
- **Week 6-8**: Intermediate topics (Trees, Graphs, Dynamic Programming)
- **Week 9-10**: Advanced topics (Heaps, Tries, Advanced graphs)
- **Week 11-12**: Company-specific focus + Mock interviews + Weakpoint revision

## 11. Preparation Resources Included
- Company interview experience blogs/vlogs
- Recommended LeetCode problem lists for each company
- System design basics for senior roles
- Behavioral interview guides
- Resume review templates
- Salary negotiation guides
- Interview day checklists

## 12. Success Metrics
- User conversion from "learning" to "interview-ready" status
- Company-wise interview success rate (user feedback)
- Average problems solved per company path
- Time-to-completion of 12-week roadmap
- User feedback on interview success

## 13. Tech Stack
- Frontend: React + Vite + Monaco Editor
- Backend: Node.js APIs (scalable architecture)
- Judge: Docker workers + Redis queue for code execution
- Database: PostgreSQL (Supabase) for problem bank, progress tracking
- Cache: Redis for leaderboards, problem recommendations
- ML/Analytics: Gemini API for personalized recommendations

## 14. Phase-wise Rollout
- **Phase 1**: Google + Meta paths, Core DSA topics, 500 problems
- **Phase 2**: Add Amazon, Microsoft, Apple paths, Advanced topics
- **Phase 3**: Add other tech companies (Uber, TikTok, Stripe, etc.)
- **Phase 4**: System design module, Video solutions from ex-interviewers
