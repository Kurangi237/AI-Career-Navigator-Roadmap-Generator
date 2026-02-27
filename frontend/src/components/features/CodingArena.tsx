import React, { useState } from 'react';
import type { UserProfile } from '@shared/types';
import './CodingArena.css';

type ViewMode = 'companies' | 'company-detail' | 'dsa-topics' | 'roadmap' | 'resources' | 'timeline';
type Company = 'google' | 'meta' | 'amazon' | 'microsoft' | 'apple' | 'uber' | 'goldman' | 'netflix' | 'tesla' | 'stripe' | 'doordash' | 'airbnb' | 'openai' | 'anthropic' | 'perplexity' | 'huggingface' | 'databricks' | 'oracle' | 'ibm' | 'salesforce' | 'linkedin' | 'tiktok' | 'bytedance' | 'alibaba' | 'tencent' | 'baidu' | 'paypal' | 'stripe' | 'square' | 'robinhood' | 'bloomberg' | 'citadel' | 'jane_street' | 'tower_research' | 'optiver' | 'dRW' | 'citrix' | 'vmware' | 'atlassian' | 'shopify' | 'slack' | 'figma' | 'notion' | 'canva' | 'asana' | 'github' | 'gitlab' | 'twilio' | 'okta' | 'cloudflare' | 'datadog' | 'elastic' | 'mongodb';

interface CompanyInfo {
  id: Company;
  name: string;
  logo: string;
  category: 'FAANG' | 'AI' | 'FinTech' | 'Startup' | 'Enterprise' | 'Chinese Tech';
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

interface TimelineLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  days: number;
  description: string;
  weeks: RoadmapWeek[];
  materials: { title: string; type: string; cost: string }[];
}

const COMPANIES: Record<Company, CompanyInfo> = {
  // FAANG
  google: { id: 'google', name: 'Google', logo: '🔍', category: 'FAANG', description: 'Google is known for DSA-heavy interviews with emphasis on optimization.', focusAreas: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Hash Tables'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard - Focus on optimization and scalability', interviewPattern: 'Multiple rounds of DSA coding, system design for L4+', topicsWeight: { algorithms: 70, systemDesign: 30, behavioral: 20 } },
  meta: { id: 'meta', name: 'Meta', logo: '📘', category: 'FAANG', description: 'Meta emphasizes practical DSA with real product focus.', focusAreas: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Design Patterns'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA coding rounds, system design for seniors', topicsWeight: { algorithms: 80, systemDesign: 20, behavioral: 15 } },
  amazon: { id: 'amazon', name: 'Amazon', logo: '🎯', category: 'FAANG', description: 'Amazon combines DSA with leadership principles and deep dives.', focusAreas: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'OOP Design'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard - Deep dives', interviewPattern: 'Coding + behavioral (leadership principles), system design', topicsWeight: { algorithms: 60, systemDesign: 20, behavioral: 40 } },
  microsoft: { id: 'microsoft', name: 'Microsoft', logo: '🪟', category: 'FAANG', description: 'Microsoft values clear communication and optimization.', focusAreas: ['Trees & Graphs', 'Arrays & Strings', 'Dynamic Programming'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'Coding rounds, sometimes cloud/Azure context', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 15 } },
  apple: { id: 'apple', name: 'Apple', logo: '🍎', category: 'FAANG', description: 'Apple focuses on optimization and hardware-aware algorithms.', focusAreas: ['Time & Space Optimization', 'Bit Manipulation', 'Memory Efficiency'], roundsCount: 5, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'DSA coding, potential hardware/OS context', topicsWeight: { algorithms: 85, optimization: 40, behavioral: 15 } },

  // AI Companies
  openai: { id: 'openai', name: 'OpenAI', logo: '🤖', category: 'AI', description: 'OpenAI focuses on ML algorithms, ML systems, and scalability.', focusAreas: ['Algorithms', 'ML Fundamentals', 'System Design', 'Math'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + ML knowledge, system design', topicsWeight: { algorithms: 70, ml: 40, behavioral: 15 } },
  anthropic: { id: 'anthropic', name: 'Anthropic', logo: '🧠', category: 'AI', description: 'Anthropic values strong fundamentals and research-oriented thinking.', focusAreas: ['Algorithms', 'Math', 'ML Concepts'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'Technical + research discussion', topicsWeight: { algorithms: 75, research: 40, behavioral: 15 } },
  perplexity: { id: 'perplexity', name: 'Perplexity', logo: '❓', category: 'AI', description: 'Perplexity emphasizes algorithms and efficient information retrieval.', focusAreas: ['Graphs', 'Search Algorithms', 'Caching', 'Optimization'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA coding, product thinking', topicsWeight: { algorithms: 80, systemDesign: 30, behavioral: 15 } },
  huggingface: { id: 'huggingface', name: 'Hugging Face', logo: '🤗', category: 'AI', description: 'Hugging Face focuses on practical algorithms and community-driven approach.', focusAreas: ['Graphs', 'Trees', 'Dynamic Programming'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + open-source experience', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 20 } },
  databricks: { id: 'databricks', name: 'Databricks', logo: '📊', category: 'AI', description: 'Databricks values distributed systems knowledge and algorithms.', focusAreas: ['Graphs', 'Trees', 'Distributed Systems', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design focus', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },

  // FinTech
  uber: { id: 'uber', name: 'Uber', logo: '🚗', category: 'Startup', description: 'Uber emphasizes graphs and real-world problem solving.', focusAreas: ['Graphs & Paths', 'Heaps & Priority Queues', 'Spatial Indexing'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'Coding with product context, system design focus', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 20 } },
  stripe: { id: 'stripe', name: 'Stripe', logo: '💳', category: 'FinTech', description: 'Stripe focuses on reliability, scalability, and real-world systems.', focusAreas: ['System Design', 'Algorithms', 'Distributed Systems'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design hybrid', topicsWeight: { algorithms: 65, systemDesign: 50, behavioral: 20 } },
  goldman: { id: 'goldman', name: 'Goldman Sachs', logo: '📊', category: 'FinTech', description: 'Goldman Sachs requires deep algorithmic knowledge and math skills.', focusAreas: ['Dynamic Programming', 'Mathematical Algorithms', 'Complex Data Structures'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Heavy DSA, sometimes tech + finance context', topicsWeight: { algorithms: 90, mathematics: 50, behavioral: 15 } },
  citadel: { id: 'citadel', name: 'Citadel', logo: '⚡', category: 'FinTech', description: 'Citadel focuses on algorithmic thinking and optimization.', focusAreas: ['Algorithms', 'Mathematical Thinking', 'Optimization'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Pure algorithmic problems', topicsWeight: { algorithms: 95, mathematics: 60, behavioral: 10 } },
  jane_street: { id: 'jane_street', name: 'Jane Street', logo: '💰', category: 'FinTech', description: 'Jane Street values puzzle-solving and mathematical optimization.', focusAreas: ['Algorithms', 'Optimization', 'Puzzles'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic puzzles and problems', topicsWeight: { algorithms: 90, mathematics: 70, behavioral: 10 } },

  // More Companies (shortened for brevity in real implementation)
  netflix: { id: 'netflix', name: 'Netflix', logo: '🎬', category: 'Startup', description: 'Netflix focuses on scalability and system thinking.', focusAreas: ['Graphs', 'Caching', 'System Design', 'Recommendation Algorithms'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'Coding + system design hybrid', topicsWeight: { algorithms: 60, systemDesign: 50, behavioral: 20 } },
  tesla: { id: 'tesla', name: 'Tesla', logo: '⚙️', category: 'Startup', description: 'Tesla focuses on system design and optimization.', focusAreas: ['System Design', 'Algorithms', 'Real-time Systems'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 60, behavioral: 15 } },
  doordash: { id: 'doordash', name: 'DoorDash', logo: '🚚', category: 'Startup', description: 'DoorDash emphasizes algorithms and system design.', focusAreas: ['Graphs', 'Optimization', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + real-world scenarios', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  airbnb: { id: 'airbnb', name: 'Airbnb', logo: '🏠', category: 'Startup', description: 'Airbnb values both algorithms and product thinking.', focusAreas: ['Graphs', 'Trees', 'Search Problems'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA with product context', topicsWeight: { algorithms: 75, systemDesign: 30, behavioral: 20 } },
  shopify: { id: 'shopify', name: 'Shopify', logo: '🛒', category: 'Startup', description: 'Shopify focuses on scalable systems and algorithms.', focusAreas: ['Arrays', 'Trees', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 15 } },
  figma: { id: 'figma', name: 'Figma', logo: '🎨', category: 'Startup', description: 'Figma focuses on algorithms and graphics optimization.', focusAreas: ['Algorithms', 'Trees', 'Geometry'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + geometric thinking', topicsWeight: { algorithms: 75, optimization: 30, behavioral: 15 } },

  // Enterprise & Cloud
  oracle: { id: 'oracle', name: 'Oracle', logo: '🏢', category: 'Enterprise', description: 'Oracle emphasizes databases and algorithms.', focusAreas: ['Algorithms', 'Data Structures', 'Database Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA focused', topicsWeight: { algorithms: 80, databases: 40, behavioral: 15 } },
  ibm: { id: 'ibm', name: 'IBM', logo: '🖥️', category: 'Enterprise', description: 'IBM values classic computer science fundamentals.', focusAreas: ['Algorithms', 'Data Structures', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Medium', interviewPattern: 'Traditional DSA', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 15 } },
  salesforce: { id: 'salesforce', name: 'Salesforce', logo: '☁️', category: 'Enterprise', description: 'Salesforce focuses on scalability and customer-centric systems.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 65, systemDesign: 50, behavioral: 20 } },
  cloudflare: { id: 'cloudflare', name: 'Cloudflare', logo: '☁️', category: 'Enterprise', description: 'Cloudflare emphasizes performance and distributed systems.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + distributed systems', topicsWeight: { algorithms: 70, systemDesign: 60, behavioral: 15 } },

  // Placeholder entries for remaining companies (would expand in full version)
  linkedin: { id: 'linkedin', name: 'LinkedIn', logo: '💼', category: 'Enterprise', description: 'LinkedIn focuses on algorithms and graphs.', focusAreas: ['Graphs', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  tiktok: { id: 'tiktok', name: 'TikTok', logo: '🎵', category: 'Startup', description: 'TikTok emphasizes recommendations and large scale.', focusAreas: ['Graphs', 'Algorithms', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  bytedance: { id: 'bytedance', name: 'ByteDance', logo: '📱', category: 'Chinese Tech', description: 'ByteDance focuses on scale and optimization.', focusAreas: ['Algorithms', 'System Design', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 80, systemDesign: 40, behavioral: 15 } },
  alibaba: { id: 'alibaba', name: 'Alibaba', logo: '🏪', category: 'Chinese Tech', description: 'Alibaba tests on classic and modern algorithms.', focusAreas: ['Algorithms', 'Data Structures', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'Traditional + system design', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  tencent: { id: 'tencent', name: 'Tencent', logo: '🎮', category: 'Chinese Tech', description: 'Tencent focuses on algorithms and game-like optimization.', focusAreas: ['Algorithms', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA focused with variations', topicsWeight: { algorithms: 85, optimization: 30, behavioral: 15 } },
  baidu: { id: 'baidu', name: 'Baidu', logo: '🔎', category: 'Chinese Tech', description: 'Baidu emphasizes search and algorithms.', focusAreas: ['Graphs', 'Search Algorithms', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 85, systemDesign: 30, behavioral: 15 } },
  paypal: { id: 'paypal', name: 'PayPal', logo: '💵', category: 'FinTech', description: 'PayPal values secure and scalable systems.', focusAreas: ['System Design', 'Algorithms', 'Security'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  square: { id: 'square', name: 'Square', logo: '⬜', category: 'FinTech', description: 'Square focuses on payments and real-time systems.', focusAreas: ['System Design', 'Algorithms', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 45, behavioral: 15 } },
  robinhood: { id: 'robinhood', name: 'Robinhood', logo: '📈', category: 'FinTech', description: 'Robinhood emphasizes trading systems and optimization.', focusAreas: ['Algorithms', 'System Design', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  bloomberg: { id: 'bloomberg', name: 'Bloomberg', logo: '💹', category: 'FinTech', description: 'Bloomberg tests classic and financial algorithms.', focusAreas: ['Algorithms', 'Financial Algorithms', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 85, finance: 40, behavioral: 15 } },
  optiver: { id: 'optiver', name: 'Optiver', logo: '⚡', category: 'FinTech', description: 'Optiver focuses on algorithmic trading and optimization.', focusAreas: ['Algorithms', 'Math', 'Optimization'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Pure algorithmic problems', topicsWeight: { algorithms: 90, mathematics: 70, behavioral: 10 } },
  tower_research: { id: 'tower_research', name: 'Tower Research', logo: '🔬', category: 'FinTech', description: 'Tower Research emphasizes math and algorithms.', focusAreas: ['Algorithms', 'Math', 'Optimization'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic challenges', topicsWeight: { algorithms: 90, mathematics: 80, behavioral: 10 } },
  dRW: { id: 'dRW', name: 'DRW', logo: '💼', category: 'FinTech', description: 'DRW tests on algorithms and trading concepts.', focusAreas: ['Algorithms', 'Math', 'Financial Knowledge'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic and trading problems', topicsWeight: { algorithms: 85, mathematics: 60, behavioral: 15 } },
  citrix: { id: 'citrix', name: 'Citrix', logo: '🖥️', category: 'Enterprise', description: 'Citrix focuses on virtualization and system design.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  vmware: { id: 'vmware', name: 'VMware', logo: '⚙️', category: 'Enterprise', description: 'VMware tests on system design and algorithms.', focusAreas: ['System Design', 'Algorithms', 'Virtualization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
  atlassian: { id: 'atlassian', name: 'Atlassian', logo: '🔧', category: 'Startup', description: 'Atlassian values practical algorithms and team fit.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + behavioral', topicsWeight: { algorithms: 70, systemDesign: 30, behavioral: 30 } },
  slack: { id: 'slack', name: 'Slack', logo: '💬', category: 'Startup', description: 'Slack focuses on real-time systems and algorithms.', focusAreas: ['System Design', 'Algorithms', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 20 } },
  notion: { id: 'notion', name: 'Notion', logo: '📝', category: 'Startup', description: 'Notion emphasizes algorithms and product thinking.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium', interviewPattern: 'DSA focused', topicsWeight: { algorithms: 75, systemDesign: 30, behavioral: 25 } },
  canva: { id: 'canva', name: 'Canva', logo: '🎨', category: 'Startup', description: 'Canva focuses on algorithms and user experience.', focusAreas: ['Algorithms', 'Optimization', 'Graphics'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + design thinking', topicsWeight: { algorithms: 75, optimization: 30, behavioral: 20 } },
  asana: { id: 'asana', name: 'Asana', logo: '✅', category: 'Startup', description: 'Asana tests on algorithms and system design.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 20 } },
  github: { id: 'github', name: 'GitHub', logo: '🐙', category: 'Startup', description: 'GitHub emphasizes algorithms and distributed systems.', focusAreas: ['Algorithms', 'System Design', 'Distributed Systems'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  gitlab: { id: 'gitlab', name: 'GitLab', logo: '🦊', category: 'Startup', description: 'GitLab values algorithms and collaborative thinking.', focusAreas: ['Algorithms', 'System Design', 'Performance'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 45, behavioral: 20 } },
  twilio: { id: 'twilio', name: 'Twilio', logo: '📞', category: 'Startup', description: 'Twilio focuses on real-time communication and algorithms.', focusAreas: ['Algorithms', 'System Design', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  okta: { id: 'okta', name: 'Okta', logo: '🔐', category: 'Enterprise', description: 'Okta emphasizes security and identity algorithms.', focusAreas: ['Algorithms', 'Security', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + security knowledge', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  datadog: { id: 'datadog', name: 'Datadog', logo: '📊', category: 'Enterprise', description: 'Datadog focuses on performance optimization and algorithms.', focusAreas: ['Algorithms', 'System Design', 'Performance'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
  elastic: { id: 'elastic', name: 'Elastic', logo: '🔍', category: 'Enterprise', description: 'Elastic tests on search algorithms and system design.', focusAreas: ['Algorithms', 'Search', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  mongodb: { id: 'mongodb', name: 'MongoDB', logo: '🍃', category: 'Enterprise', description: 'MongoDB focuses on database algorithms and system design.', focusAreas: ['Algorithms', 'Database Design', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
};

const DSA_TOPICS_ROADMAP: RoadmapWeek[] = [
  { week: 1, phase: 'Foundations', topics: ['Time & Space Complexity', 'Big O Notation', 'Basic Arrays & Lists'], resources: ['GeeksforGeeks', 'YouTube: TCS'], practiceProblems: 15 },
  { week: 2, phase: 'Foundations', topics: ['Recursion & Backtracking', 'Stacks & Queues'], resources: ['YouTube: Tushar Roy', 'InterviewBit'], practiceProblems: 20 },
  { week: 3, phase: 'Core DSA', topics: ['Two Pointers', 'Sliding Window', 'Arrays & Strings'], resources: ['LeetCode Premium', 'NeetCode'], practiceProblems: 25 },
  { week: 4, phase: 'Core DSA', topics: ['Hash Tables', 'HashMap Patterns', 'Frequency Counting'], resources: ['LeetCode', 'AlgoExpert'], practiceProblems: 20 },
  { week: 5, phase: 'Core DSA', topics: ['Linked Lists', 'Reversal', 'Cycle Detection'], resources: ['GeeksforGeeks', 'YouTube tutorials'], practiceProblems: 15 },
  { week: 6, phase: 'Important Topics', topics: ['Trees: DFS, BFS, Level-Order', 'Binary Search Trees'], resources: ['Visualgo', 'LeetCode', 'YouTube'], practiceProblems: 30 },
  { week: 7, phase: 'Important Topics', topics: ['Graphs: DFS, BFS', 'Shortest Path', 'Connectivity'], resources: ['William Fiset Videos', 'LeetCode', 'Codeforces'], practiceProblems: 30 },
  { week: 8, phase: 'Important Topics', topics: ['Dynamic Programming Patterns', 'Memoization vs Tabulation'], resources: ['Errichto DP', 'GeeksforGeeks', 'LeetCode'], practiceProblems: 35 },
  { week: 9, phase: 'Advanced', topics: ['Heaps & Priority Queues', 'Tries', 'Segment Trees'], resources: ['LeetCode', 'Codeforces', 'GeeksforGeeks'], practiceProblems: 25 },
  { week: 10, phase: 'Company Focus', topics: ['Company-specific topic deep dives'], resources: ['Company-specific problem lists', 'Blind posts'], practiceProblems: 30 },
  { week: 11, phase: 'Mock Interviews', topics: ['Mock coding interviews', 'Weak topic revision'], resources: ['Pramp', 'Interviewing.io', 'Company-specific patterns'], practiceProblems: 20 },
  { week: 12, phase: 'Final Prep', topics: ['Final revision', 'Last-minute tips', 'Mock interviews'], resources: ['All resources', 'Interview tips'], practiceProblems: 25 },
];

const TIMELINE_PATHS: TimelineLevel[] = [
  {
    level: 'beginner',
    days: 15,
    description: '2-3 weeks intensive crash course for fundamentals',
    weeks: DSA_TOPICS_ROADMAP.slice(0, 2),
    materials: [
      { title: 'GeeksforGeeks DSA Tutorial', type: 'Video Series', cost: 'Free' },
      { title: 'Coding Simplified YouTube', type: 'Videos', cost: 'Free' },
      { title: 'Khan Academy - Big O', type: 'Course', cost: 'Free' },
      { title: 'InterviewBit - Array Problems', type: 'Platform', cost: 'Paid' },
    ],
  },
  {
    level: 'intermediate',
    days: 40,
    description: '5-6 weeks to master core DSA topics and interview basics',
    weeks: DSA_TOPICS_ROADMAP.slice(2, 8),
    materials: [
      { title: 'LeetCode (Free Tier)', type: 'Platform', cost: 'Free' },
      { title: 'NeetCode - Comprehensive Path', type: 'Videos', cost: 'Free' },
      { title: 'Educative - Grokking Algorithms', type: 'Course', cost: 'Paid ($99)' },
      { title: 'AlgoExpert - 150+ Problems', type: 'Platform', cost: 'Paid ($99/year)' },
      { title: 'Cracking the Coding Interview', type: 'Book', cost: 'Paid ($35)' },
    ],
  },
  {
    level: 'advanced',
    days: 70,
    description: '10 weeks complete preparation for top company interviews',
    weeks: DSA_TOPICS_ROADMAP,
    materials: [
      { title: 'LeetCode Premium', type: 'Platform', cost: 'Paid ($159/year)' },
      { title: 'AlgoExpert Complete', type: 'Platform', cost: 'Paid ($99/year)' },
      { title: 'Educative System Design', type: 'Course', cost: 'Paid ($99)' },
      { title: 'Pramp Mock Interviews', type: 'Service', cost: 'Free' },
      { title: 'Interviewing.io Expert Mocks', type: 'Service', cost: 'Paid ($200+)' },
      { title: 'Blind Interview Patterns', type: 'Community', cost: 'Free' },
    ],
  },
];

const RESOURCES_BY_TYPE: Resource[] = [
  { title: 'LeetCode', type: 'platform', url: 'https://www.leetcode.com', cost: 'paid', description: 'Essential platform with company filters, premium gives mock interviews' },
  { title: 'GeeksforGeeks', type: 'platform', url: 'https://www.geeksforgeeks.org', cost: 'free', description: 'Best for concept learning with clear explanations' },
  { title: 'Educative', type: 'course', url: 'https://www.educative.io', cost: 'paid', description: 'Structured courses on DSA and system design' },
  { title: 'NeetCode', type: 'video', url: 'https://neetcode.io', cost: 'free', description: 'YouTube channel with excellent algorithm explanations' },
  { title: 'Pramp', type: 'platform', url: 'https://www.pramp.com', cost: 'free', description: 'Free peer-to-peer mock interviews' },
  { title: 'Cracking the Coding Interview', type: 'book', url: 'https://www.crackingthecodinginterview.com', cost: 'paid', description: 'Industry standard book for interview prep' },
  { title: 'AlgoExpert', type: 'platform', url: 'https://www.algoexpert.io', cost: 'paid', description: '150+ problems with detailed video explanations' },
  { title: 'ByteByteGo', type: 'video', url: 'https://www.youtube.com/c/ByteByteGo', cost: 'free', description: 'System design and algorithm videos' },
];

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const MNCDSAPrepHub: React.FC<Props> = ({ user, onBack }) => {
  const [view, setView] = useState<ViewMode>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'FAANG' | 'AI' | 'FinTech' | 'Startup' | 'Enterprise' | 'Chinese Tech'>('All');

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setView('company-detail');
  };

  const filteredCompanies = Object.values(COMPANIES).filter((c) => categoryFilter === 'All' || c.category === categoryFilter);

  const renderCompanyGrid = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {(['All', 'FAANG', 'AI', 'FinTech', 'Startup', 'Enterprise', 'Chinese Tech'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full transition-colors ${
              categoryFilter === cat ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCompanies.map((company) => (
          <button
            key={company.id}
            onClick={() => handleSelectCompany(company.id)}
            className="glass-panel rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left text-sm flex flex-col items-center justify-center min-h-[180px]"
          >
            <div className="text-5xl mb-3">{company.logo}</div>
            <h3 className="font-bold text-white text-sm text-center">{company.name}</h3>
            <span className="inline-block mt-2 px-2 py-1 bg-orange-500/30 text-orange-200 text-xs rounded">{company.category}</span>
          </button>
        ))}
      </div>
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
              <p className="text-xs text-slate-400">Rounds</p>
              <p className="text-xl font-bold text-white">{company.roundsCount}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Time</p>
              <p className="text-sm font-bold text-white">{company.roundTime}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Category</p>
              <p className="text-sm font-bold text-orange-300">{company.category}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-400">Difficulty</p>
              <p className="text-sm font-bold text-white">High</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Interview Details</h3>
          <p className="text-slate-300 mb-4">{company.interviewPattern}</p>

          <h4 className="font-bold text-white mt-6 mb-3">Key Focus Areas</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {company.focusAreas.map((area) => (
              <span key={area} className="px-3 py-1 bg-blue-500/30 text-blue-200 text-sm rounded-full">
                {area}
              </span>
            ))}
          </div>

          <h4 className="font-bold text-white mb-3">Interview Weight Distribution</h4>
          <div className="space-y-3">
            {Object.entries(company.topicsWeight).map(([topic, weight]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{topic}</span>
                  <span className="text-white font-bold">{weight}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-2 rounded-full" style={{ width: `${weight}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setView('dsa-topics')}
            className="glass-panel rounded-lg p-3 hover:bg-orange-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-1">📚</p>
            <p className="font-bold text-white text-xs">Topics</p>
          </button>
          <button
            onClick={() => setView('timeline')}
            className="glass-panel rounded-lg p-3 hover:bg-blue-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-1">⏱️</p>
            <p className="font-bold text-white text-xs">Timeline</p>
          </button>
          <button
            onClick={() => setView('roadmap')}
            className="glass-panel rounded-lg p-3 hover:bg-green-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-1">🗺️</p>
            <p className="font-bold text-white text-xs">Roadmap</p>
          </button>
          <button
            onClick={() => setView('resources')}
            className="glass-panel rounded-lg p-3 hover:bg-yellow-500/10 transition-colors text-center"
          >
            <p className="text-2xl mb-1">🔗</p>
            <p className="font-bold text-white text-xs">Resources</p>
          </button>
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Interview Preparation Timelines</h3>

        <div className="space-y-6">
          {TIMELINE_PATHS.map((path) => (
            <div key={path.level} className="border-l-4 border-orange-500 pl-6 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white capitalize">{path.level} Path</h4>
                  <p className="text-slate-300 text-sm">{path.days} Days  •  {path.description}</p>
                </div>
                <div className="bg-orange-500/20 rounded-lg px-4 py-2 whitespace-nowrap">
                  <p className="text-orange-300 font-bold">{path.days} Days</p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <h5 className="font-bold text-white mb-3">Recommended Materials</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {path.materials.map((material) => (
                    <div key={material.title} className="bg-slate-800 rounded p-3 text-sm">
                      <p className="font-semibold text-white">{material.title}</p>
                      <p className="text-slate-400 text-xs">{material.type} • {material.cost}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h5 className="font-bold text-white mb-3">Topics to Cover</h5>
                <div className="space-y-2">
                  {path.weeks.map((week) => (
                    <div key={week.week} className="text-sm text-slate-300">
                      <p>
                        <strong className="text-orange-300">Week {week.week}:</strong> {week.topics.join(' • ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back
      </button>
    </div>
  );

  const renderDSATopics = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Complete DSA Learning Path</h3>
        <div className="space-y-4">
          {DSA_TOPICS_ROADMAP.map((week) => (
            <div key={week.week} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl font-bold text-orange-500">W{week.week}</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{week.phase}</h4>
                  <p className="text-xs text-slate-400">{week.practiceProblems} problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                <strong>Topics:</strong> {week.topics.join(', ')}
              </p>
              <p className="text-sm text-slate-300">
                <strong>Resources:</strong> {week.resources.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back
      </button>
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">4-Phase Interview Preparation</h3>
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-200 font-bold mb-2">✅ Phase 1: Foundation (Weeks 1-2)</p>
            <p className="text-sm text-slate-300">Learn complexity analysis, basic data structures, recursion</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 font-bold mb-2">🔵 Phase 2: Core DSA (Weeks 3-8)</p>
            <p className="text-sm text-slate-300">Master arrays, strings, trees, graphs, dynamic programming</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-200 font-bold mb-2">⭐ Phase 3: Advanced (Weeks 9-10)</p>
            <p className="text-sm text-slate-300">Heaps, tries, segment trees, advanced graph algorithms</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <p className="text-rose-200 font-bold mb-2">🎯 Phase 4: Mock Interviews (Weeks 11-12)</p>
            <p className="text-sm text-slate-300">Mock interviews, weak area revision, final preparation</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back
      </button>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Learning Resources</h3>
        <div className="space-y-4">
          <h4 className="font-bold text-white">Free Platforms</h4>
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
              </a>
            ))}
          </div>

          <h4 className="font-bold text-white mt-6">Paid Resources</h4>
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
              </a>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        ← Back
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
        <p className="text-slate-300">
          Master Data Structures and Algorithms with company-specific learning paths. Choose from 50+ top MNC and AI companies to see their interview patterns, DSA topics, and preparation roadmaps.
        </p>
        <p className="text-slate-400 text-sm mt-2">Total Companies: <strong className="text-orange-300">{Object.keys(COMPANIES).length}</strong> - FAANG, AI, FinTech, Startups & More</p>
      </div>

      {view === 'companies' && renderCompanyGrid()}
      {view === 'company-detail' && renderCompanyDetail()}
      {view === 'dsa-topics' && renderDSATopics()}
      {view === 'timeline' && renderTimeline()}
      {view === 'roadmap' && renderRoadmap()}
      {view === 'resources' && renderResources()}
    </div>
  );
};

export default MNCDSAPrepHub;
