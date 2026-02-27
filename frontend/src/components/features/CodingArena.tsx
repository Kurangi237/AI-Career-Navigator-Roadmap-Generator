import React, { useState } from 'react';
import type { UserProfile } from '@shared/types';
import './CodingArena.css';

type ViewMode = 'companies' | 'company-detail' | 'dsa-topics' | 'roadmap' | 'resources';
type Company = 'google' | 'meta' | 'amazon' | 'microsoft' | 'apple' | 'uber' | 'goldman' | 'netflix';

interface CompanyInfo {
  id: Company;
  name: string;
  logo: string;
  description: string;
  focusAreas: string[];
  roundsCount: number;
  roundTime: string;
  difficulty: string;
  interviewPattern: string;
  topicsWeight: Record<string, number>;
}

interface Resource {
  title: string;
  type: 'platform' | 'article' | 'video' | 'book' | 'course';
  url: string;
  cost: 'free' | 'paid';
  description: string;
}

interface RoadmapWeek {
  week: number;
  phase: string;
  topics: string[];
  resources: string[];
  practiceProblems: number;
}

const COMPANIES: Record<Company, CompanyInfo> = {
  google: {
    id: 'google',
    name: 'Google',
    logo: '🔍',
    description: 'Google is known for DSA-heavy interviews with emphasis on optimization.',
    focusAreas: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Hash Tables'],
    roundsCount: 4,
    roundTime: '45-60 minutes each',
    difficulty: 'Hard - Focus on optimization and scalability',
    interviewPattern: 'Multiple rounds of DSA coding, system design for L4+',
    topicsWeight: { algorithms: 70, systemDesign: 30, behavioral: 20 },
  },
  meta: {
    id: 'meta',
    name: 'Meta (Facebook)',
    logo: '📘',
    description: 'Meta emphasizes practical DSA with real product focus.',
    focusAreas: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Design Patterns'],
    roundsCount: 3,
    roundTime: '45 minutes each',
    difficulty: 'Medium-Hard - Speed and clarity matter',
    interviewPattern: 'DSA coding rounds, system design for seniors',
    topicsWeight: { algorithms: 80, systemDesign: 20, behavioral: 15 },
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    logo: '🎯',
    description: 'Amazon combines DSA with leadership principles and deep dives.',
    focusAreas: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'OOP Design'],
    roundsCount: 5,
    roundTime: '60 minutes each',
    difficulty: 'Hard - Deep dives on every solution',
    interviewPattern: 'Coding + behavioral (leadership principles), system design',
    topicsWeight: { algorithms: 60, systemDesign: 20, behavioral: 40 },
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    logo: '🪟',
    description: 'Microsoft values clear communication and optimization.',
    focusAreas: ['Trees & Graphs', 'Arrays & Strings', 'Dynamic Programming'],
    roundsCount: 4,
    roundTime: '45-60 minutes each',
    difficulty: 'Medium-Hard - Communication is key',
    interviewPattern: 'Coding rounds, sometimes cloud/Azure context',
    topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 15 },
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    logo: '🍎',
    description: 'Apple focuses on optimization and hardware-aware algorithms.',
    focusAreas: ['Time & Space Optimization', 'Bit Manipulation', 'Memory Efficiency'],
    roundsCount: 5,
    roundTime: '45-60 minutes each',
    difficulty: 'Hard - Optimization critical, sometimes hardware context',
    interviewPattern: 'DSA coding, potential hardware/OS context',
    topicsWeight: { algorithms: 85, optimization: 40, behavioral: 15 },
  },
  uber: {
    id: 'uber',
    name: 'Uber',
    logo: '🚗',
    description: 'Uber emphasizes graphs and real-world problem solving.',
    focusAreas: ['Graphs & Paths', 'Heaps & Priority Queues', 'Spatial Indexing', 'Caching'],
    roundsCount: 4,
    roundTime: '45-60 minutes each',
    difficulty: 'Medium-Hard - Real-world context important',
    interviewPattern: 'Coding with product context, system design focus',
    topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 20 },
  },
  goldman: {
    id: 'goldman',
    name: 'Goldman Sachs',
    logo: '📊',
    description: 'Goldman Sachs requires deep algorithmic knowledge and math skills.',
    focusAreas: ['Dynamic Programming', 'Mathematical Algorithms', 'Complex Data Structures'],
    roundsCount: 5,
    roundTime: '60 minutes each',
    difficulty: 'Hard - Mathematical depth required',
    interviewPattern: 'Heavy DSA, sometimes tech + finance context',
    topicsWeight: { algorithms: 90, mathematics: 50, behavioral: 15 },
  },
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    logo: '🎬',
    description: 'Netflix focuses on scalability and system thinking.',
    focusAreas: ['Graphs', 'Caching', 'System Design', 'Recommendation Algorithms'],
    roundsCount: 4,
    roundTime: '45-60 minutes each',
    difficulty: 'Hard - Scale and design thinking matter',
    interviewPattern: 'Coding + system design hybrid',
    topicsWeight: { algorithms: 60, systemDesign: 50, behavioral: 20 },
  },
};

const DSA_TOPICS_ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    phase: 'Foundations',
    topics: ['Time & Space Complexity', 'Big O Notation', 'Basic Arrays & Lists'],
    resources: ['GeeksforGeeks', 'YouTube: TCS'],
    practiceProblems: 15,
  },
  {
    week: 2,
    phase: 'Foundations',
    topics: ['Recursion & Backtracking', 'Stacks & Queues'],
    resources: ['YouTube: Tushar Roy', 'InterviewBit'],
    practiceProblems: 20,
  },
  {
    week: 3,
    phase: 'Core DSA',
    topics: ['Two Pointers', 'Sliding Window', 'Arrays & Strings'],
    resources: ['LeetCode Premium', 'NeetCode'],
    practiceProblems: 25,
  },
  {
    week: 4,
    phase: 'Core DSA',
    topics: ['Hash Tables', 'HashMap Patterns', 'Frequency Counting'],
    resources: ['LeetCode', 'AlgoExpert'],
    practiceProblems: 20,
  },
  {
    week: 5,
    phase: 'Core DSA',
    topics: ['Linked Lists', 'Reversal', 'Cycle Detection'],
    resources: ['GeeksforGeeks', 'YouTube tutorials'],
    practiceProblems: 15,
  },
  {
    week: 6,
    phase: 'Important Topics',
    topics: ['Trees: DFS, BFS, Level-Order', 'Binary Search Trees'],
    resources: ['Visualgo', 'LeetCode', 'YouTube'],
    practiceProblems: 30,
  },
  {
    week: 7,
    phase: 'Important Topics',
    topics: ['Graphs: DFS, BFS', 'Shortest Path', 'Connectivity'],
    resources: ['William Fiset Videos', 'LeetCode', 'Codeforces'],
    practiceProblems: 30,
  },
  {
    week: 8,
    phase: 'Important Topics',
    topics: ['Dynamic Programming Patterns', 'Memoization vs Tabulation'],
    resources: ['Errichto DP', 'GeeksforGeeks', 'LeetCode'],
    practiceProblems: 35,
  },
  {
    week: 9,
    phase: 'Advanced',
    topics: ['Heaps & Priority Queues', 'Tries', 'Segment Trees'],
    resources: ['LeetCode', 'Codeforces', 'GeeksforGeeks'],
    practiceProblems: 25,
  },
  {
    week: 10,
    phase: 'Company Focus',
    topics: ['Company-specific topic deep dives'],
    resources: ['Company-specific problem lists', 'Blind posts'],
    practiceProblems: 30,
  },
  {
    week: 11,
    phase: 'Mock Interviews',
    topics: ['Mock coding interviews', 'Weak topic revision'],
    resources: ['Pramp', 'Interviewing.io', 'Company-specific patterns'],
    practiceProblems: 20,
  },
  {
    week: 12,
    phase: 'Final Prep',
    topics: ['Final revision', 'Last-minute tips', 'Mock interviews'],
    resources: ['All resources', 'Interview tips'],
    practiceProblems: 25,
  },
];

const RESOURCES_BY_TYPE: Resource[] = [
  {
    title: 'LeetCode',
    type: 'platform',
    url: 'https://www.leetcode.com',
    cost: 'paid',
    description: 'Essential platform with company filters, premium gives mock interviews',
  },
  {
    title: 'GeeksforGeeks',
    type: 'platform',
    url: 'https://www.geeksforgeeks.org',
    cost: 'free',
    description: 'Best for concept learning with clear explanations',
  },
  {
    title: 'Educative',
    type: 'course',
    url: 'https://www.educative.io',
    cost: 'paid',
    description: 'Structured courses on DSA and system design',
  },
  {
    title: 'NeetCode',
    type: 'video',
    url: 'https://neetcode.io',
    cost: 'free',
    description: 'YouTube channel with excellent algorithm explanations',
  },
  {
    title: 'Pramp',
    type: 'platform',
    url: 'https://www.pramp.com',
    cost: 'free',
    description: 'Free peer-to-peer mock interviews',
  },
  {
    title: 'Cracking the Coding Interview',
    type: 'book',
    url: 'https://www.crackingthecodinginterview.com',
    cost: 'paid',
    description: 'Industry standard book for interview prep',
  },
  {
    title: 'AlgoExpert',
    type: 'platform',
    url: 'https://www.algoexpert.io',
    cost: 'paid',
    description: '150+ problems with detailed video explanations',
  },
  {
    title: 'ByteByteGo',
    type: 'video',
    url: 'https://www.youtube.com/c/ByteByteGo',
    cost: 'free',
    description: 'System design and algorithm videos',
  },
];

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const MNCDSAPrepHub: React.FC<Props> = ({ user, onBack }) => {
  const [view, setView] = useState<ViewMode>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setView('company-detail');
  };

  const renderCompanyGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(COMPANIES).map((company) => (
        <button
          key={company.id}
          onClick={() => handleSelectCompany(company.id)}
          className="glass-panel rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left"
        >
          <div className="text-4xl mb-3">{company.logo}</div>
          <h3 className="text-xl font-bold text-white mb-2">{company.name}</h3>
          <p className="text-sm text-slate-300 mb-4">{company.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-orange-500/30 text-orange-200 text-xs rounded">
              {company.roundsCount} rounds
            </span>
            <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">
              {company.roundTime}
            </span>
          </div>
          <p className="text-xs text-slate-400">{company.difficulty}</p>
        </button>
      ))}
    </div>
  );

  const renderCompanyDetail = () => {
    if (!selectedCompany) return null;
    const company = COMPANIES[selectedCompany];

    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{company.logo}</span>
            <div>
              <h2 className="text-3xl font-bold text-white">{company.name}</h2>
              <p className="text-slate-300">{company.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Interview Rounds</p>
              <p className="text-xl font-bold text-white">{company.roundsCount}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Time Per Round</p>
              <p className="text-sm font-bold text-white">{company.roundTime}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Difficulty</p>
              <p className="text-sm font-bold text-orange-300">Hard</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Pattern</p>
              <p className="text-sm font-bold text-white">DSA Heavy</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Interview Pattern</h3>
          <p className="text-slate-300 mb-4">{company.interviewPattern}</p>

          <h4 className="font-bold text-white mt-6 mb-3">Focus Areas</h4>
          <div className="flex flex-wrap gap-2">
            {company.focusAreas.map((area) => (
              <span key={area} className="px-3 py-1 bg-blue-500/30 text-blue-200 text-sm rounded-full">
                {area}
              </span>
            ))}
          </div>

          <h4 className="font-bold text-white mt-6 mb-3">Topic Weight</h4>
          <div className="space-y-3">
            {Object.entries(company.topicsWeight).map(([topic, weight]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{topic}</span>
                  <span className="text-white font-bold">{weight}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-rose-500 h-2 rounded-full"
                    style={{ width: `${weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setView('dsa-topics')}
            className="glass-panel rounded-lg p-4 hover:bg-orange-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-2">📚</p>
            <p className="font-bold text-white text-sm">DSA Topics</p>
            <p className="text-xs text-slate-400">12 Weeks</p>
          </button>
          <button
            onClick={() => setView('roadmap')}
            className="glass-panel rounded-lg p-4 hover:bg-blue-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-2">🗺️</p>
            <p className="font-bold text-white text-sm">Roadmap</p>
            <p className="text-xs text-slate-400">Preparation</p>
          </button>
          <button
            onClick={() => setView('resources')}
            className="glass-panel rounded-lg p-4 hover:bg-green-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-2">🔗</p>
            <p className="font-bold text-white text-sm">Resources</p>
            <p className="text-xs text-slate-400">Links & Tips</p>
          </button>
        </div>
      </div>
    );
  };

  const renderDSATopics = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">12-Week DSA Preparation</h3>
        <p className="text-slate-300 mb-6">
          Follow this comprehensive roadmap covering all DSA topics from fundamentals to advanced algorithms.
        </p>

        <div className="space-y-4">
          {DSA_TOPICS_ROADMAP.map((week) => (
            <div key={week.week} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl font-bold text-orange-500">W{week.week}</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{week.phase}</h4>
                  <p className="text-xs text-slate-400">{week.practiceProblems} problems recommended</p>
                </div>
                <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">
                  {week.topics.length} topics
                </span>
              </div>

              <div className="ml-0">
                <p className="text-sm text-slate-300 mb-2">
                  <strong>Topics:</strong> {week.topics.join(', ')}
                </p>
                <p className="text-sm text-slate-300 mb-2">
                  <strong>Resources:</strong> {week.resources.join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back to Company
      </button>
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Interview Preparation Roadmap</h3>

        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-200 font-bold mb-2">✅ Phase 1: Foundation</p>
            <p className="text-sm text-slate-300">Weeks 1-2: Learn complexity analysis, basic data structures</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 font-bold mb-2">🔵 Phase 2: Core DSA</p>
            <p className="text-sm text-slate-300">Weeks 3-8: Master arrays, strings, trees, graphs, DP</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-200 font-bold mb-2">⭐ Phase 3: Advanced</p>
            <p className="text-sm text-slate-300">Weeks 9-10: Heaps, tries, advanced algorithms</p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <p className="text-rose-200 font-bold mb-2">🎯 Phase 4: Interviews</p>
            <p className="text-sm text-slate-300">Weeks 11-12: Mock interviews, weak topic revision</p>
          </div>
        </div>

        <h4 className="font-bold text-white mt-8 mb-4">Daily Success Tips</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>✓ Solve 2-3 problems daily with same difficulty</li>
          <li>✓ Focus on optimal solution, not just working code</li>
          <li>✓ Discuss trade-offs: time vs space</li>
          <li>✓ Review solutions after solving</li>
          <li>✓ Practice mock interviews weekly</li>
          <li>✓ Maintain consistency over perfection</li>
        </ul>
      </div>

      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back to Company
      </button>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Essential Resources</h3>

        <div className="space-y-4">
          <h4 className="font-bold text-white text-lg mt-4">Free Platforms</h4>
          <div className="space-y-3">
            {RESOURCES_BY_TYPE.filter((r) => r.cost === 'free').map((resource) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-900/50 hover:bg-slate-800/50 rounded-lg p-4 transition-colors"
              >
                <p className="font-bold text-white">{resource.title}</p>
                <p className="text-sm text-slate-300 mt-1">{resource.description}</p>
                <p className="text-xs text-green-400 mt-2">↗ Free</p>
              </a>
            ))}
          </div>

          <h4 className="font-bold text-white text-lg mt-6">Paid Platforms (Worth Investment)</h4>
          <div className="space-y-3">
            {RESOURCES_BY_TYPE.filter((r) => r.cost === 'paid').map((resource) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-900/50 hover:bg-slate-800/50 rounded-lg p-4 transition-colors"
              >
                <p className="font-bold text-white">{resource.title}</p>
                <p className="text-sm text-slate-300 mt-1">{resource.description}</p>
                <p className="text-xs text-orange-400 mt-2">↗ Paid</p>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <p className="font-bold text-blue-200 mb-2">💡 Recommendation</p>
          <p className="text-sm text-slate-300">
            Use free platforms first (GeeksforGeeks, LeetCode free tier, Pramp) to build foundation. Invest in LeetCode Premium (
            <strong>$159/year</strong>) only after solving 100+ free problems.
          </p>
        </div>
      </div>

      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back to Company
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">MNC DSA Prep Hub</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          Back
        </button>
      </div>

      <div className="glass-panel rounded-lg p-6">
        <p className="text-slate-300 mb-4">
          Master Data Structures and Algorithms with company-specific learning paths. Choose a top MNC company below to see their
          interview patterns, DSA topics, and preparation roadmap.
        </p>
      </div>

      {view === 'companies' && renderCompanyGrid()}
      {view === 'company-detail' && renderCompanyDetail()}
      {view === 'dsa-topics' && renderDSATopics()}
      {view === 'roadmap' && renderRoadmap()}
      {view === 'resources' && renderResources()}
    </div>
  );
};

export default MNCDSAPrepHub;
