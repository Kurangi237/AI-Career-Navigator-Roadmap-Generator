import React, { useState } from 'react';
import './MNCDSAPrepHub.css';

type ViewMode = 'companies' | 'company-detail' | 'dsa-topics' | 'roadmap' | 'resources' | 'timeline';

interface CompanyInfo {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string;
  domain?: string;
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
  durationWeeks: number;
  subjects: string[];
  tags?: string[];
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

const COMPANIES: Record<string, CompanyInfo> = {
  // FAANG
  google: { id: 'google', name: 'Google', logo: '', category: 'FAANG', description: 'Google is known for DSA-heavy interviews with emphasis on optimization.', focusAreas: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Hash Tables'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard - Focus on optimization and scalability', interviewPattern: 'Multiple rounds of DSA coding, system design for L4+', topicsWeight: { algorithms: 70, systemDesign: 30, behavioral: 20 } },
  meta: { id: 'meta', name: 'Meta', logo: '', category: 'FAANG', description: 'Meta emphasizes practical DSA with real product focus.', focusAreas: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Design Patterns'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA coding rounds, system design for seniors', topicsWeight: { algorithms: 80, systemDesign: 20, behavioral: 15 } },
  amazon: { id: 'amazon', name: 'Amazon', logo: '', category: 'FAANG', description: 'Amazon combines DSA with leadership principles and deep dives.', focusAreas: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'OOP Design'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard - Deep dives', interviewPattern: 'Coding + behavioral (leadership principles), system design', topicsWeight: { algorithms: 60, systemDesign: 20, behavioral: 40 } },
  microsoft: { id: 'microsoft', name: 'Microsoft', logo: '', category: 'FAANG', description: 'Microsoft values clear communication and optimization.', focusAreas: ['Trees & Graphs', 'Arrays & Strings', 'Dynamic Programming'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'Coding rounds, sometimes cloud/Azure context', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 15 } },
  apple: { id: 'apple', name: 'Apple', logo: '', category: 'FAANG', description: 'Apple focuses on optimization and hardware-aware algorithms.', focusAreas: ['Time & Space Optimization', 'Bit Manipulation', 'Memory Efficiency'], roundsCount: 5, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'DSA coding, potential hardware/OS context', topicsWeight: { algorithms: 85, optimization: 40, behavioral: 15 } },

  // AI Companies
  openai: { id: 'openai', name: 'OpenAI', logo: '', category: 'AI', description: 'OpenAI focuses on ML algorithms, ML systems, and scalability.', focusAreas: ['Algorithms', 'ML Fundamentals', 'System Design', 'Math'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + ML knowledge, system design', topicsWeight: { algorithms: 70, ml: 40, behavioral: 15 } },
  anthropic: { id: 'anthropic', name: 'Anthropic', logo: '', category: 'AI', description: 'Anthropic values strong fundamentals and research-oriented thinking.', focusAreas: ['Algorithms', 'Math', 'ML Concepts'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'Technical + research discussion', topicsWeight: { algorithms: 75, research: 40, behavioral: 15 } },
  perplexity: { id: 'perplexity', name: 'Perplexity', logo: '', category: 'AI', description: 'Perplexity emphasizes algorithms and efficient information retrieval.', focusAreas: ['Graphs', 'Search Algorithms', 'Caching', 'Optimization'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA coding, product thinking', topicsWeight: { algorithms: 80, systemDesign: 30, behavioral: 15 } },
  huggingface: { id: 'huggingface', name: 'Hugging Face', logo: '', category: 'AI', description: 'Hugging Face focuses on practical algorithms and community-driven approach.', focusAreas: ['Graphs', 'Trees', 'Dynamic Programming'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + open-source experience', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 20 } },
  databricks: { id: 'databricks', name: 'Databricks', logo: '', category: 'AI', description: 'Databricks values distributed systems knowledge and algorithms.', focusAreas: ['Graphs', 'Trees', 'Distributed Systems', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design focus', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },

  // FinTech
  uber: { id: 'uber', name: 'Uber', logo: '', category: 'Startup', description: 'Uber emphasizes graphs and real-world problem solving.', focusAreas: ['Graphs & Paths', 'Heaps & Priority Queues', 'Spatial Indexing'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'Coding with product context, system design focus', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 20 } },
  stripe: { id: 'stripe', name: 'Stripe', logo: '', category: 'FinTech', description: 'Stripe focuses on reliability, scalability, and real-world systems.', focusAreas: ['System Design', 'Algorithms', 'Distributed Systems'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design hybrid', topicsWeight: { algorithms: 65, systemDesign: 50, behavioral: 20 } },
  goldman: { id: 'goldman', name: 'Goldman Sachs', logo: '', category: 'FinTech', description: 'Goldman Sachs requires deep algorithmic knowledge and math skills.', focusAreas: ['Dynamic Programming', 'Mathematical Algorithms', 'Complex Data Structures'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Heavy DSA, sometimes tech + finance context', topicsWeight: { algorithms: 90, mathematics: 50, behavioral: 15 } },
  citadel: { id: 'citadel', name: 'Citadel', logo: '', category: 'FinTech', description: 'Citadel focuses on algorithmic thinking and optimization.', focusAreas: ['Algorithms', 'Mathematical Thinking', 'Optimization'], roundsCount: 5, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Pure algorithmic problems', topicsWeight: { algorithms: 95, mathematics: 60, behavioral: 10 } },
  jane_street: { id: 'jane_street', name: 'Jane Street', logo: '', category: 'FinTech', description: 'Jane Street values puzzle-solving and mathematical optimization.', focusAreas: ['Algorithms', 'Optimization', 'Puzzles'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic puzzles and problems', topicsWeight: { algorithms: 90, mathematics: 70, behavioral: 10 } },

  // More Companies (shortened for brevity in real implementation)
  netflix: { id: 'netflix', name: 'Netflix', logo: '', category: 'Startup', description: 'Netflix focuses on scalability and system thinking.', focusAreas: ['Graphs', 'Caching', 'System Design', 'Recommendation Algorithms'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'Coding + system design hybrid', topicsWeight: { algorithms: 60, systemDesign: 50, behavioral: 20 } },
  tesla: { id: 'tesla', name: 'Tesla', logo: '', category: 'Startup', description: 'Tesla focuses on system design and optimization.', focusAreas: ['System Design', 'Algorithms', 'Real-time Systems'], roundsCount: 4, roundTime: '45-60 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 60, behavioral: 15 } },
  doordash: { id: 'doordash', name: 'DoorDash', logo: '', category: 'Startup', description: 'DoorDash emphasizes algorithms and system design.', focusAreas: ['Graphs', 'Optimization', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + real-world scenarios', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  airbnb: { id: 'airbnb', name: 'Airbnb', logo: '', category: 'Startup', description: 'Airbnb values both algorithms and product thinking.', focusAreas: ['Graphs', 'Trees', 'Search Problems'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA with product context', topicsWeight: { algorithms: 75, systemDesign: 30, behavioral: 20 } },
  shopify: { id: 'shopify', name: 'Shopify', logo: '', category: 'Startup', description: 'Shopify focuses on scalable systems and algorithms.', focusAreas: ['Arrays', 'Trees', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 15 } },
  figma: { id: 'figma', name: 'Figma', logo: '', category: 'Startup', description: 'Figma focuses on algorithms and graphics optimization.', focusAreas: ['Algorithms', 'Trees', 'Geometry'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + geometric thinking', topicsWeight: { algorithms: 75, optimization: 30, behavioral: 15 } },

  // Enterprise & Cloud
  oracle: { id: 'oracle', name: 'Oracle', logo: '', category: 'Enterprise', description: 'Oracle emphasizes databases and algorithms.', focusAreas: ['Algorithms', 'Data Structures', 'Database Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA focused', topicsWeight: { algorithms: 80, databases: 40, behavioral: 15 } },
  ibm: { id: 'ibm', name: 'IBM', logo: '', category: 'Enterprise', description: 'IBM values classic computer science fundamentals.', focusAreas: ['Algorithms', 'Data Structures', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Medium', interviewPattern: 'Traditional DSA', topicsWeight: { algorithms: 75, systemDesign: 25, behavioral: 15 } },
  salesforce: { id: 'salesforce', name: 'Salesforce', logo: '', category: 'Enterprise', description: 'Salesforce focuses on scalability and customer-centric systems.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 65, systemDesign: 50, behavioral: 20 } },
  cloudflare: { id: 'cloudflare', name: 'Cloudflare', logo: '', category: 'Enterprise', description: 'Cloudflare emphasizes performance and distributed systems.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + distributed systems', topicsWeight: { algorithms: 70, systemDesign: 60, behavioral: 15 } },

  // Placeholder entries for remaining companies (would expand in full version)
  linkedin: { id: 'linkedin', name: 'LinkedIn', logo: '', category: 'Enterprise', description: 'LinkedIn focuses on algorithms and graphs.', focusAreas: ['Graphs', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  tiktok: { id: 'tiktok', name: 'TikTok', logo: '', category: 'Startup', description: 'TikTok emphasizes recommendations and large scale.', focusAreas: ['Graphs', 'Algorithms', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  bytedance: { id: 'bytedance', name: 'ByteDance', logo: '', category: 'Chinese Tech', description: 'ByteDance focuses on scale and optimization.', focusAreas: ['Algorithms', 'System Design', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 80, systemDesign: 40, behavioral: 15 } },
  alibaba: { id: 'alibaba', name: 'Alibaba', logo: '', category: 'Chinese Tech', description: 'Alibaba tests on classic and modern algorithms.', focusAreas: ['Algorithms', 'Data Structures', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'Traditional + system design', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  tencent: { id: 'tencent', name: 'Tencent', logo: '', category: 'Chinese Tech', description: 'Tencent focuses on algorithms and game-like optimization.', focusAreas: ['Algorithms', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA focused with variations', topicsWeight: { algorithms: 85, optimization: 30, behavioral: 15 } },
  baidu: { id: 'baidu', name: 'Baidu', logo: '', category: 'Chinese Tech', description: 'Baidu emphasizes search and algorithms.', focusAreas: ['Graphs', 'Search Algorithms', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 85, systemDesign: 30, behavioral: 15 } },
  paypal: { id: 'paypal', name: 'PayPal', logo: '', category: 'FinTech', description: 'PayPal values secure and scalable systems.', focusAreas: ['System Design', 'Algorithms', 'Security'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  square: { id: 'square', name: 'Square', logo: '', category: 'FinTech', description: 'Square focuses on payments and real-time systems.', focusAreas: ['System Design', 'Algorithms', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 45, behavioral: 15 } },
  robinhood: { id: 'robinhood', name: 'Robinhood', logo: '', category: 'FinTech', description: 'Robinhood emphasizes trading systems and optimization.', focusAreas: ['Algorithms', 'System Design', 'Optimization'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  bloomberg: { id: 'bloomberg', name: 'Bloomberg', logo: '', category: 'FinTech', description: 'Bloomberg tests classic and financial algorithms.', focusAreas: ['Algorithms', 'Financial Algorithms', 'System Design'], roundsCount: 4, roundTime: '50 minutes each', difficulty: 'Hard', interviewPattern: 'DSA heavy', topicsWeight: { algorithms: 85, finance: 40, behavioral: 15 } },
  optiver: { id: 'optiver', name: 'Optiver', logo: '', category: 'FinTech', description: 'Optiver focuses on algorithmic trading and optimization.', focusAreas: ['Algorithms', 'Math', 'Optimization'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Pure algorithmic problems', topicsWeight: { algorithms: 90, mathematics: 70, behavioral: 10 } },
  tower_research: { id: 'tower_research', name: 'Tower Research', logo: '', category: 'FinTech', description: 'Tower Research emphasizes math and algorithms.', focusAreas: ['Algorithms', 'Math', 'Optimization'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic challenges', topicsWeight: { algorithms: 90, mathematics: 80, behavioral: 10 } },
  dRW: { id: 'dRW', name: 'DRW', logo: '', category: 'FinTech', description: 'DRW tests on algorithms and trading concepts.', focusAreas: ['Algorithms', 'Math', 'Financial Knowledge'], roundsCount: 4, roundTime: '60 minutes each', difficulty: 'Hard', interviewPattern: 'Algorithmic and trading problems', topicsWeight: { algorithms: 85, mathematics: 60, behavioral: 15 } },
  citrix: { id: 'citrix', name: 'Citrix', logo: '', category: 'Enterprise', description: 'Citrix focuses on virtualization and system design.', focusAreas: ['System Design', 'Algorithms', 'Optimization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  vmware: { id: 'vmware', name: 'VMware', logo: '', category: 'Enterprise', description: 'VMware tests on system design and algorithms.', focusAreas: ['System Design', 'Algorithms', 'Virtualization'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
  atlassian: { id: 'atlassian', name: 'Atlassian', logo: '', category: 'Startup', description: 'Atlassian values practical algorithms and team fit.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + behavioral', topicsWeight: { algorithms: 70, systemDesign: 30, behavioral: 30 } },
  slack: { id: 'slack', name: 'Slack', logo: '', category: 'Startup', description: 'Slack focuses on real-time systems and algorithms.', focusAreas: ['System Design', 'Algorithms', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 20 } },
  notion: { id: 'notion', name: 'Notion', logo: '', category: 'Startup', description: 'Notion emphasizes algorithms and product thinking.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium', interviewPattern: 'DSA focused', topicsWeight: { algorithms: 75, systemDesign: 30, behavioral: 25 } },
  canva: { id: 'canva', name: 'Canva', logo: '', category: 'Startup', description: 'Canva focuses on algorithms and user experience.', focusAreas: ['Algorithms', 'Optimization', 'Graphics'], roundsCount: 3, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + design thinking', topicsWeight: { algorithms: 75, optimization: 30, behavioral: 20 } },
  asana: { id: 'asana', name: 'Asana', logo: '', category: 'Startup', description: 'Asana tests on algorithms and system design.', focusAreas: ['Algorithms', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 40, behavioral: 20 } },
  github: { id: 'github', name: 'GitHub', logo: '', category: 'Startup', description: 'GitHub emphasizes algorithms and distributed systems.', focusAreas: ['Algorithms', 'System Design', 'Distributed Systems'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  gitlab: { id: 'gitlab', name: 'GitLab', logo: '', category: 'Startup', description: 'GitLab values algorithms and collaborative thinking.', focusAreas: ['Algorithms', 'System Design', 'Performance'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 45, behavioral: 20 } },
  twilio: { id: 'twilio', name: 'Twilio', logo: '', category: 'Startup', description: 'Twilio focuses on real-time communication and algorithms.', focusAreas: ['Algorithms', 'System Design', 'Real-time'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 70, systemDesign: 50, behavioral: 15 } },
  okta: { id: 'okta', name: 'Okta', logo: '', category: 'Enterprise', description: 'Okta emphasizes security and identity algorithms.', focusAreas: ['Algorithms', 'Security', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Medium-Hard', interviewPattern: 'DSA + security knowledge', topicsWeight: { algorithms: 75, systemDesign: 40, behavioral: 15 } },
  datadog: { id: 'datadog', name: 'Datadog', logo: '', category: 'Enterprise', description: 'Datadog focuses on performance optimization and algorithms.', focusAreas: ['Algorithms', 'System Design', 'Performance'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
  elastic: { id: 'elastic', name: 'Elastic', logo: '', category: 'Enterprise', description: 'Elastic tests on search algorithms and system design.', focusAreas: ['Algorithms', 'Search', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 50, behavioral: 15 } },
  mongodb: { id: 'mongodb', name: 'MongoDB', logo: '', category: 'Enterprise', description: 'MongoDB focuses on database algorithms and system design.', focusAreas: ['Algorithms', 'Database Design', 'System Design'], roundsCount: 4, roundTime: '45 minutes each', difficulty: 'Hard', interviewPattern: 'DSA + system design', topicsWeight: { algorithms: 75, systemDesign: 55, behavioral: 15 } },
};

const TARGET_COMPANY_COUNT = 200;
const slugifyCompany = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const DEFAULT_FOCUS: Record<CompanyInfo['category'], string[]> = {
  FAANG: ['Algorithms', 'System Design', 'Behavioral'],
  AI: ['Algorithms', 'ML Fundamentals', 'System Design'],
  FinTech: ['Algorithms', 'Optimization', 'System Design'],
  Startup: ['Algorithms', 'Product Thinking', 'System Design'],
  Enterprise: ['Algorithms', 'Scalability', 'System Design'],
  'Chinese Tech': ['Algorithms', 'Optimization', 'System Design'],
};
const DEFAULT_WEIGHTS: Record<CompanyInfo['category'], Record<string, number>> = {
  FAANG: { algorithms: 80, systemDesign: 35, behavioral: 20 },
  AI: { algorithms: 75, systemDesign: 35, ml: 35 },
  FinTech: { algorithms: 85, systemDesign: 30, mathematics: 25 },
  Startup: { algorithms: 70, systemDesign: 35, behavioral: 20 },
  Enterprise: { algorithms: 70, systemDesign: 40, behavioral: 20 },
  'Chinese Tech': { algorithms: 82, systemDesign: 30, optimization: 25 },
};
const EXTRA_COMPANY_SEEDS: Array<{ name: string; domain: string; category: CompanyInfo['category'] }> = [
  { name: 'Adobe', domain: 'adobe.com', category: 'Enterprise' },
  { name: 'Accenture', domain: 'accenture.com', category: 'Enterprise' },
  { name: 'Airbus', domain: 'airbus.com', category: 'Enterprise' },
  { name: 'Airtable', domain: 'airtable.com', category: 'Startup' },
  { name: 'AMD', domain: 'amd.com', category: 'Enterprise' },
  { name: 'Amadeus', domain: 'amadeus.com', category: 'Enterprise' },
  { name: 'American Express', domain: 'americanexpress.com', category: 'FinTech' },
  { name: 'AppLovin', domain: 'applovin.com', category: 'Startup' },
  { name: 'ASML', domain: 'asml.com', category: 'Enterprise' },
  { name: 'Autodesk', domain: 'autodesk.com', category: 'Enterprise' },
  { name: 'Avanade', domain: 'avanade.com', category: 'Enterprise' },
  { name: 'Bain & Company', domain: 'bain.com', category: 'Enterprise' },
  { name: 'Barclays', domain: 'barclays.com', category: 'FinTech' },
  { name: 'Block', domain: 'block.xyz', category: 'FinTech' },
  { name: 'Booking.com', domain: 'booking.com', category: 'Startup' },
  { name: 'Boston Consulting Group', domain: 'bcg.com', category: 'Enterprise' },
  { name: 'Broadcom', domain: 'broadcom.com', category: 'Enterprise' },
  { name: 'BytePlus', domain: 'byteplus.com', category: 'Chinese Tech' },
  { name: 'Capgemini', domain: 'capgemini.com', category: 'Enterprise' },
  { name: 'Cisco', domain: 'cisco.com', category: 'Enterprise' },
  { name: 'Coinbase', domain: 'coinbase.com', category: 'FinTech' },
  { name: 'Cohere', domain: 'cohere.com', category: 'AI' },
  { name: 'Confluent', domain: 'confluent.io', category: 'Enterprise' },
  { name: 'Coursera', domain: 'coursera.org', category: 'Startup' },
  { name: 'CrowdStrike', domain: 'crowdstrike.com', category: 'Enterprise' },
  { name: 'Dell', domain: 'dell.com', category: 'Enterprise' },
  { name: 'Deloitte', domain: 'deloitte.com', category: 'Enterprise' },
  { name: 'Discord', domain: 'discord.com', category: 'Startup' },
  { name: 'Dropbox', domain: 'dropbox.com', category: 'Startup' },
  { name: 'EPAM', domain: 'epam.com', category: 'Enterprise' },
  { name: 'Ericsson', domain: 'ericsson.com', category: 'Enterprise' },
  { name: 'eBay', domain: 'ebay.com', category: 'Enterprise' },
  { name: 'Electronic Arts', domain: 'ea.com', category: 'Enterprise' },
  { name: 'Expedia', domain: 'expediagroup.com', category: 'Startup' },
  { name: 'EY', domain: 'ey.com', category: 'Enterprise' },
  { name: 'FactSet', domain: 'factset.com', category: 'FinTech' },
  { name: 'Fastly', domain: 'fastly.com', category: 'Enterprise' },
  { name: 'Flipkart', domain: 'flipkart.com', category: 'Startup' },
  { name: 'Fortinet', domain: 'fortinet.com', category: 'Enterprise' },
  { name: 'Freshworks', domain: 'freshworks.com', category: 'Startup' },
  { name: 'Gartner', domain: 'gartner.com', category: 'Enterprise' },
  { name: 'Grab', domain: 'grab.com', category: 'Startup' },
  { name: 'Grammarly', domain: 'grammarly.com', category: 'Startup' },
  { name: 'HCLTech', domain: 'hcltech.com', category: 'Enterprise' },
  { name: 'HP', domain: 'hp.com', category: 'Enterprise' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'Startup' },
  { name: 'Huawei', domain: 'huawei.com', category: 'Chinese Tech' },
  { name: 'Infor', domain: 'infor.com', category: 'Enterprise' },
  { name: 'Infineon', domain: 'infineon.com', category: 'Enterprise' },
  { name: 'Infosys', domain: 'infosys.com', category: 'Enterprise' },
  { name: 'Instacart', domain: 'instacart.com', category: 'Startup' },
  { name: 'Intel', domain: 'intel.com', category: 'Enterprise' },
  { name: 'Intuit', domain: 'intuit.com', category: 'FinTech' },
  { name: 'Jio', domain: 'jio.com', category: 'Enterprise' },
  { name: 'JPMorgan Chase', domain: 'jpmorganchase.com', category: 'FinTech' },
  { name: 'Kakao', domain: 'kakaocorp.com', category: 'Startup' },
  { name: 'Klarna', domain: 'klarna.com', category: 'FinTech' },
  { name: 'KPMG', domain: 'kpmg.com', category: 'Enterprise' },
  { name: 'L&T Technology Services', domain: 'ltts.com', category: 'Enterprise' },
  { name: 'Lattice', domain: 'lattice.com', category: 'Startup' },
  { name: 'Lemonade', domain: 'lemonade.com', category: 'FinTech' },
  { name: 'Lenovo', domain: 'lenovo.com', category: 'Enterprise' },
  { name: 'Lucid', domain: 'lucid.co', category: 'Startup' },
  { name: 'Lyft', domain: 'lyft.com', category: 'Startup' },
  { name: 'Maersk', domain: 'maersk.com', category: 'Enterprise' },
  { name: 'Mambu', domain: 'mambu.com', category: 'FinTech' },
  { name: 'McKinsey', domain: 'mckinsey.com', category: 'Enterprise' },
  { name: 'Meesho', domain: 'meesho.com', category: 'Startup' },
  { name: 'Micron', domain: 'micron.com', category: 'Enterprise' },
  { name: 'Miro', domain: 'miro.com', category: 'Startup' },
  { name: 'Mistral AI', domain: 'mistral.ai', category: 'AI' },
  { name: 'Mixpanel', domain: 'mixpanel.com', category: 'Startup' },
  { name: 'Nagarro', domain: 'nagarro.com', category: 'Enterprise' },
  { name: 'Nokia', domain: 'nokia.com', category: 'Enterprise' },
  { name: 'Nvidia', domain: 'nvidia.com', category: 'AI' },
  { name: 'Nutanix', domain: 'nutanix.com', category: 'Enterprise' },
  { name: 'NYTimes', domain: 'nytimes.com', category: 'Enterprise' },
  { name: 'Ola', domain: 'olacabs.com', category: 'Startup' },
  { name: 'Palantir', domain: 'palantir.com', category: 'Enterprise' },
  { name: 'Paytm', domain: 'paytm.com', category: 'FinTech' },
  { name: 'PDD Holdings', domain: 'pddholdings.com', category: 'Chinese Tech' },
  { name: 'PhonePe', domain: 'phonepe.com', category: 'FinTech' },
  { name: 'Pinterest', domain: 'pinterest.com', category: 'Startup' },
  { name: 'Postman', domain: 'postman.com', category: 'Startup' },
  { name: 'PwC', domain: 'pwc.com', category: 'Enterprise' },
  { name: 'Qualcomm', domain: 'qualcomm.com', category: 'Enterprise' },
  { name: 'Rakuten', domain: 'rakuten.com', category: 'Startup' },
  { name: 'Razorpay', domain: 'razorpay.com', category: 'FinTech' },
  { name: 'Red Hat', domain: 'redhat.com', category: 'Enterprise' },
  { name: 'Revolut', domain: 'revolut.com', category: 'FinTech' },
  { name: 'Rivian', domain: 'rivian.com', category: 'Startup' },
  { name: 'S&P Global', domain: 'spglobal.com', category: 'FinTech' },
  { name: 'SAP', domain: 'sap.com', category: 'Enterprise' },
  { name: 'ServiceNow', domain: 'servicenow.com', category: 'Enterprise' },
  { name: 'Seagate', domain: 'seagate.com', category: 'Enterprise' },
  { name: 'Siemens', domain: 'siemens.com', category: 'Enterprise' },
  { name: 'Snap', domain: 'snap.com', category: 'Startup' },
  { name: 'Snowflake', domain: 'snowflake.com', category: 'AI' },
  { name: 'Sony', domain: 'sony.com', category: 'Enterprise' },
  { name: 'Spotify', domain: 'spotify.com', category: 'Startup' },
  { name: 'State Street', domain: 'statestreet.com', category: 'FinTech' },
  { name: 'Swiggy', domain: 'swiggy.com', category: 'Startup' },
  { name: 'Synopsys', domain: 'synopsys.com', category: 'Enterprise' },
  { name: 'Tata Consultancy Services', domain: 'tcs.com', category: 'Enterprise' },
  { name: 'Target', domain: 'target.com', category: 'Enterprise' },
  { name: 'Temu', domain: 'temu.com', category: 'Chinese Tech' },
  { name: 'ThoughtWorks', domain: 'thoughtworks.com', category: 'Enterprise' },
  { name: 'TikTok Shop', domain: 'seller-us.tiktok.com', category: 'Chinese Tech' },
  { name: 'Toast', domain: 'toasttab.com', category: 'Startup' },
  { name: 'Tokopedia', domain: 'tokopedia.com', category: 'Startup' },
  { name: 'Trend Micro', domain: 'trendmicro.com', category: 'Enterprise' },
  { name: 'Tripadvisor', domain: 'tripadvisor.com', category: 'Startup' },
  { name: 'UiPath', domain: 'uipath.com', category: 'Enterprise' },
  { name: 'Unity', domain: 'unity.com', category: 'Startup' },
  { name: 'Upstox', domain: 'upstox.com', category: 'FinTech' },
  { name: 'Verizon', domain: 'verizon.com', category: 'Enterprise' },
  { name: 'Visa', domain: 'visa.com', category: 'FinTech' },
  { name: 'Vodafone', domain: 'vodafone.com', category: 'Enterprise' },
  { name: 'Walmart', domain: 'walmart.com', category: 'Enterprise' },
  { name: 'Wayfair', domain: 'wayfair.com', category: 'Startup' },
  { name: 'Western Digital', domain: 'westerndigital.com', category: 'Enterprise' },
  { name: 'Wise', domain: 'wise.com', category: 'FinTech' },
  { name: 'Workday', domain: 'workday.com', category: 'Enterprise' },
  { name: 'Xiaomi', domain: 'xiaomi.com', category: 'Chinese Tech' },
  { name: 'Xero', domain: 'xero.com', category: 'FinTech' },
  { name: 'Yahoo', domain: 'yahoo.com', category: 'Enterprise' },
  { name: 'Yandex', domain: 'yandex.com', category: 'Chinese Tech' },
  { name: 'Zalando', domain: 'zalando.com', category: 'Startup' },
  { name: 'Zepto', domain: 'zepto.now', category: 'Startup' },
  { name: 'Zomato', domain: 'zomato.com', category: 'Startup' },
  { name: 'Zoom', domain: 'zoom.us', category: 'Startup' },
  { name: 'Zoho', domain: 'zoho.com', category: 'Enterprise' },
  { name: 'ZS Associates', domain: 'zs.com', category: 'Enterprise' },
  { name: 'Naver', domain: 'navercorp.com', category: 'Chinese Tech' },
  { name: 'Coupang', domain: 'coupang.com', category: 'Startup' },
  { name: 'Mercado Libre', domain: 'mercadolibre.com', category: 'Startup' },
  { name: 'GrabPay', domain: 'grab.com', category: 'FinTech' },
  { name: 'Intercom', domain: 'intercom.com', category: 'Startup' },
  { name: 'Plaid', domain: 'plaid.com', category: 'FinTech' },
  { name: 'Brex', domain: 'brex.com', category: 'FinTech' },
  { name: 'Ramp', domain: 'ramp.com', category: 'FinTech' },
  { name: 'Figma AI', domain: 'figma.com', category: 'AI' },
  { name: 'Scale AI', domain: 'scale.com', category: 'AI' },
  { name: 'Anduril', domain: 'anduril.com', category: 'Startup' },
  { name: 'Robin AI', domain: 'robinai.com', category: 'AI' },
  { name: 'Builder.ai', domain: 'builder.ai', category: 'AI' },
  { name: 'C3 AI', domain: 'c3.ai', category: 'AI' },
  { name: 'Dataiku', domain: 'dataiku.com', category: 'AI' },
  { name: 'SambaNova', domain: 'sambanova.ai', category: 'AI' },
  { name: 'Together AI', domain: 'together.ai', category: 'AI' },
  { name: 'Fireworks AI', domain: 'fireworks.ai', category: 'AI' },
  { name: 'Runway', domain: 'runwayml.com', category: 'AI' },
  { name: 'Pinecone', domain: 'pinecone.io', category: 'AI' },
  { name: 'MongoDB Atlas', domain: 'mongodb.com', category: 'Enterprise' },
  { name: 'ClickHouse', domain: 'clickhouse.com', category: 'Enterprise' },
  { name: 'Supabase', domain: 'supabase.com', category: 'Startup' },
  { name: 'Vercel', domain: 'vercel.com', category: 'Startup' },
  { name: 'Netlify', domain: 'netlify.com', category: 'Startup' },
  { name: 'PlanetScale', domain: 'planetscale.com', category: 'Startup' },
  { name: 'Render', domain: 'render.com', category: 'Startup' },
  { name: 'Railway', domain: 'railway.app', category: 'Startup' },
  { name: 'Apollo GraphQL', domain: 'apollographql.com', category: 'Startup' },
  { name: 'CloudBees', domain: 'cloudbees.com', category: 'Enterprise' },
  { name: 'HashiCorp', domain: 'hashicorp.com', category: 'Enterprise' },
  { name: 'Snyk', domain: 'snyk.io', category: 'Enterprise' },
  { name: 'Palo Alto Networks', domain: 'paloaltonetworks.com', category: 'Enterprise' },
  { name: 'Arista Networks', domain: 'arista.com', category: 'Enterprise' },
  { name: 'Atos', domain: 'atos.net', category: 'Enterprise' },
  { name: 'BMC Software', domain: 'bmc.com', category: 'Enterprise' },
  { name: 'Cadence', domain: 'cadence.com', category: 'Enterprise' },
  { name: 'Check Point', domain: 'checkpoint.com', category: 'Enterprise' },
  { name: 'Cloudera', domain: 'cloudera.com', category: 'Enterprise' },
  { name: 'Comcast', domain: 'corporate.comcast.com', category: 'Enterprise' },
  { name: 'Couchbase', domain: 'couchbase.com', category: 'Enterprise' },
  { name: 'DigitalOcean', domain: 'digitalocean.com', category: 'Startup' },
  { name: 'DocuSign', domain: 'docusign.com', category: 'Enterprise' },
  { name: 'F5 Networks', domain: 'f5.com', category: 'Enterprise' },
  { name: 'Infor Nexus', domain: 'infor.com', category: 'Enterprise' },
  { name: 'Juniper Networks', domain: 'juniper.net', category: 'Enterprise' },
  { name: 'Keysight', domain: 'keysight.com', category: 'Enterprise' },
  { name: 'Logitech', domain: 'logitech.com', category: 'Enterprise' },
  { name: 'Marvell', domain: 'marvell.com', category: 'Enterprise' },
  { name: 'NICE', domain: 'nice.com', category: 'Enterprise' },
  { name: 'Pegasystems', domain: 'pega.com', category: 'Enterprise' },
  { name: 'Pure Storage', domain: 'purestorage.com', category: 'Enterprise' },
  { name: 'Qlik', domain: 'qlik.com', category: 'Enterprise' },
  { name: 'RingCentral', domain: 'ringcentral.com', category: 'Enterprise' },
  { name: 'SAS', domain: 'sas.com', category: 'Enterprise' },
  { name: 'SEMrush', domain: 'semrush.com', category: 'Startup' },
  { name: 'Splunk', domain: 'splunk.com', category: 'Enterprise' },
  { name: 'Trulioo', domain: 'trulioo.com', category: 'FinTech' },
  { name: 'Yubico', domain: 'yubico.com', category: 'Enterprise' },
  { name: 'Zendesk', domain: 'zendesk.com', category: 'Enterprise' },
  { name: 'Zscaler', domain: 'zscaler.com', category: 'Enterprise' },
];

const existingIds = new Set(Object.keys(COMPANIES).map((id) => id.toLowerCase()));
const neededExtraCount = Math.max(0, TARGET_COMPANY_COUNT - Object.keys(COMPANIES).length);
const AUTO_COMPANIES = EXTRA_COMPANY_SEEDS
  .map((seed) => {
    const id = slugifyCompany(seed.name);
    return {
      id,
      name: seed.name,
      logo: '',
      domain: seed.domain,
      category: seed.category,
      description: `${seed.name} is a high-visibility ${seed.category.toLowerCase()} company with interview emphasis on problem solving and system thinking.`,
      focusAreas: DEFAULT_FOCUS[seed.category],
      roundsCount: seed.category === 'FinTech' ? 5 : seed.category === 'FAANG' ? 5 : 4,
      roundTime: seed.category === 'FinTech' ? '50-60 minutes each' : '45-60 minutes each',
      difficulty: seed.category === 'FinTech' || seed.category === 'AI' ? 'Hard' : 'Medium-Hard',
      interviewPattern: 'Coding rounds + role-fit discussion + system design for experienced candidates',
      topicsWeight: DEFAULT_WEIGHTS[seed.category],
    } as CompanyInfo;
  })
  .filter((c) => !existingIds.has(c.id))
  .slice(0, neededExtraCount);

const ALL_COMPANIES: Record<string, CompanyInfo> = {
  ...COMPANIES,
  ...Object.fromEntries(AUTO_COMPANIES.map((c) => [c.id, c])),
};

const COMPANY_LOGO_DOMAINS: Record<string, string> = {
  google: 'google.com',
  meta: 'meta.com',
  amazon: 'amazon.com',
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  openai: 'openai.com',
  anthropic: 'anthropic.com',
  perplexity: 'perplexity.ai',
  huggingface: 'huggingface.co',
  databricks: 'databricks.com',
  uber: 'uber.com',
  stripe: 'stripe.com',
  goldman: 'goldmansachs.com',
  citadel: 'citadel.com',
  jane_street: 'janestreet.com',
  netflix: 'netflix.com',
  tesla: 'tesla.com',
  doordash: 'doordash.com',
  airbnb: 'airbnb.com',
  shopify: 'shopify.com',
  figma: 'figma.com',
  oracle: 'oracle.com',
  ibm: 'ibm.com',
  salesforce: 'salesforce.com',
  cloudflare: 'cloudflare.com',
  linkedin: 'linkedin.com',
  tiktok: 'tiktok.com',
  bytedance: 'bytedance.com',
  alibaba: 'alibaba.com',
  tencent: 'tencent.com',
  baidu: 'baidu.com',
  paypal: 'paypal.com',
  square: 'squareup.com',
  robinhood: 'robinhood.com',
  bloomberg: 'bloomberg.com',
  optiver: 'optiver.com',
  tower_research: 'tower-research.com',
  drw: 'drw.com',
  citrix: 'citrix.com',
  vmware: 'vmware.com',
  atlassian: 'atlassian.com',
  slack: 'slack.com',
  notion: 'notion.so',
  canva: 'canva.com',
  asana: 'asana.com',
  github: 'github.com',
  gitlab: 'gitlab.com',
  twilio: 'twilio.com',
  okta: 'okta.com',
  datadog: 'datadoghq.com',
  elastic: 'elastic.co',
  mongodb: 'mongodb.com',
};

const getCompanyLogoUrl = (company: CompanyInfo) => {
  if (company.logoUrl) return company.logoUrl;
  if (company.domain) return `https://logo.clearbit.com/${company.domain}`;
  const key = company.id.toLowerCase();
  const domain = COMPANY_LOGO_DOMAINS[key];
  if (!domain) return '';
  return `https://logo.clearbit.com/${domain}`;
};

const CompanyLogo: React.FC<{ company: CompanyInfo; className?: string }> = ({ company, className = '' }) => {
  const base = getCompanyLogoUrl(company);
  const key = company.id.toLowerCase();
  const domain = company.domain || COMPANY_LOGO_DOMAINS[key];
  const sources = [
    base,
    domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : '',
    domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : '',
  ].filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];
  React.useEffect(() => {
    setSourceIndex(0);
  }, [company.id]);

  if (!src) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-white font-bold ${className}`}>
        {company.name.slice(0, 1)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${company.name} logo`}
      className={`rounded-lg bg-white object-contain p-2 border border-slate-700 ${className}`}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex(sourceIndex + 1);
          return;
        }
        setSourceIndex(sources.length);
      }}
    />
  );
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
  { title: 'NeetCode 150', type: 'video', url: 'https://neetcode.io', cost: 'free', description: 'Structured DSA walkthroughs for coding interviews.', durationWeeks: 4, subjects: ['algorithms', 'arrays', 'strings', 'trees', 'graphs', 'dynamic programming'], tags: ['dsa'] },
  { title: 'LeetCode Company Set', type: 'platform', url: 'https://leetcode.com/problemset/', cost: 'paid', description: 'Company-tagged problems and timed practice.', durationWeeks: 8, subjects: ['algorithms', 'system design', 'graphs', 'dynamic programming'], tags: ['dsa', 'company'] },
  { title: 'AlgoExpert', type: 'course', url: 'https://www.algoexpert.io', cost: 'paid', description: 'End-to-end interview prep with curated problem paths.', durationWeeks: 8, subjects: ['algorithms', 'data structures', 'system design'], tags: ['dsa'] },
  { title: 'Educative Grokking', type: 'course', url: 'https://www.educative.io/courses/grokking-the-coding-interview', cost: 'paid', description: 'Pattern-based interview prep course.', durationWeeks: 6, subjects: ['algorithms', 'patterns', 'dynamic programming'], tags: ['dsa'] },
  { title: 'GeeksforGeeks DSA', type: 'platform', url: 'https://www.geeksforgeeks.org/explore?page=1&category=Data%20Structures%20and%20Algorithms', cost: 'free', description: 'Detailed DSA concept explanations and practice.', durationWeeks: 6, subjects: ['algorithms', 'data structures', 'math'], tags: ['dsa'] },
  { title: 'Pramp Mocks', type: 'platform', url: 'https://www.pramp.com', cost: 'free', description: 'Mock interviews for coding and communication practice.', durationWeeks: 4, subjects: ['behavioral', 'algorithms', 'interview communication'], tags: ['mock'] },
  { title: 'System Design Primer', type: 'article', url: 'https://github.com/donnemartin/system-design-primer', cost: 'free', description: 'Hands-on system design notes and interview preparation.', durationWeeks: 8, subjects: ['system design', 'distributed systems', 'scalability'], tags: ['system design'] },
  { title: 'Cracking the Coding Interview', type: 'book', url: 'https://www.crackingthecodinginterview.com', cost: 'paid', description: 'Classic interview preparation book with patterns.', durationWeeks: 10, subjects: ['algorithms', 'behavioral', 'problem solving'], tags: ['dsa'] },
];

interface Props {
  onBack: () => void;
}

const MNCDSAPrepHub: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<ViewMode>('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'FAANG' | 'AI' | 'FinTech' | 'Startup' | 'Enterprise' | 'Chinese Tech'>('All');
  const [selectedResourceTitle, setSelectedResourceTitle] = useState('');
  const selectedCompanyInfo = selectedCompany ? ALL_COMPANIES[selectedCompany] : null;

  const handleSelectCompany = (company: string) => {
    setSelectedCompany(company);
    setSelectedResourceTitle('');
    setView('company-detail');
  };

  const topicLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());

  const buildCompanySpecificRoadmap = (company: CompanyInfo): RoadmapWeek[] => {
    const weightedTopics = Object.entries(company.topicsWeight)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topicLabel(topic));

    const highPriority = weightedTopics.slice(0, 2);
    const mediumPriority = weightedTopics.slice(2);

    return [
      {
        week: 1,
        phase: `${company.name} Foundation`,
        topics: ['Complexity Analysis', ...company.focusAreas.slice(0, 2)],
        resources: ['LeetCode', 'GeeksforGeeks'],
        practiceProblems: 15,
      },
      {
        week: 2,
        phase: `${company.name} Core Focus`,
        topics: company.focusAreas.slice(0, 3),
        resources: ['NeetCode', 'InterviewBit'],
        practiceProblems: 20,
      },
      {
        week: 3,
        phase: `${company.name} Priority Topics`,
        topics: highPriority.length ? highPriority : ['Algorithms', 'Problem Solving'],
        resources: ['Company-tagged LeetCode sets', 'AlgoExpert'],
        practiceProblems: 25,
      },
      {
        week: 4,
        phase: `${company.name} Interview Simulation`,
        topics: mediumPriority.length ? mediumPriority : ['System Design', 'Behavioral'],
        resources: ['Pramp', 'Interviewing.io', 'Mock interview sheets'],
        practiceProblems: 20,
      },
    ];
  };

  const getTopicKeysFromCompany = (company: CompanyInfo): string[] => {
    const weightedKeys = Object.entries(company.topicsWeight)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic.toLowerCase());
    const focusKeys = company.focusAreas.map((area) => area.toLowerCase());
    return Array.from(new Set([...weightedKeys, ...focusKeys]));
  };

  const getResourcesForCompany = (company: CompanyInfo): Resource[] => {
    const keys = getTopicKeysFromCompany(company);
    const matches = RESOURCES_BY_TYPE.filter((resource) =>
      resource.subjects.some((subject) => keys.some((k) => k.includes(subject) || subject.includes(k)))
    );
    return matches.length ? matches : RESOURCES_BY_TYPE;
  };

  const buildCourseDrivenRoadmap = (company: CompanyInfo, resource: Resource): RoadmapWeek[] => {
    const totalWeeks = Math.max(4, resource.durationWeeks);
    const companyTopics = Array.from(new Set([...company.focusAreas, ...Object.keys(company.topicsWeight).map(topicLabel)]));
    const phaseSize = Math.max(1, Math.ceil(totalWeeks / 4));

    const phases = [
      { name: 'Foundation', details: `Understand ${resource.title} basics and refresh interview fundamentals.` },
      { name: 'Core Build', details: `Cover highest priority topics for ${company.name}.` },
      { name: 'Advanced', details: `Practice high-complexity variations and optimization.` },
      { name: 'Interview Sprint', details: `Run mock interviews and revise weak areas.` },
    ];

    return Array.from({ length: totalWeeks }).map((_, index) => {
      const week = index + 1;
      const phaseIndex = Math.min(phases.length - 1, Math.floor(index / phaseSize));
      const start = index % companyTopics.length;
      const weekTopics = [companyTopics[start], companyTopics[(start + 1) % companyTopics.length]].filter(Boolean);
      return {
        week,
        phase: `${phases[phaseIndex].name} (${resource.title})`,
        topics: weekTopics.length ? weekTopics : ['Algorithms', 'Problem Solving'],
        resources: [resource.title, ...getResourcesForCompany(company).slice(0, 2).map((r) => r.title)],
        practiceProblems: 12 + phaseIndex * 6,
      };
    });
  };

  const buildCompanyTimelinePaths = (company: CompanyInfo): TimelineLevel[] => {
    const resources = getResourcesForCompany(company);
    const shortest = resources.reduce((acc, r) => Math.min(acc, r.durationWeeks), resources[0]?.durationWeeks || 4);
    const medium = Math.round((shortest + 8) / 2);
    const longest = resources.reduce((acc, r) => Math.max(acc, r.durationWeeks), 10);

    const beginnerWeeks = buildCourseDrivenRoadmap(company, resources[0] || RESOURCES_BY_TYPE[0]).slice(0, Math.max(2, Math.ceil(shortest / 2)));
    const intermediateWeeks = buildCourseDrivenRoadmap(company, resources[1] || resources[0] || RESOURCES_BY_TYPE[0]).slice(0, Math.max(4, medium));
    const advancedWeeks = buildCourseDrivenRoadmap(company, resources[2] || resources[0] || RESOURCES_BY_TYPE[0]).slice(0, Math.max(6, longest));

    return [
      {
        level: 'beginner',
        days: shortest * 7,
        description: `Fast-track path using ${resources[0]?.title || 'core resources'}`,
        weeks: beginnerWeeks,
        materials: resources.slice(0, 3).map((r) => ({ title: r.title, type: r.type, cost: r.cost })),
      },
      {
        level: 'intermediate',
        days: medium * 7,
        description: `Balanced path with deeper ${company.name} topic coverage`,
        weeks: intermediateWeeks,
        materials: resources.slice(0, 4).map((r) => ({ title: r.title, type: r.type, cost: r.cost })),
      },
      {
        level: 'advanced',
        days: longest * 7,
        description: `Complete prep path for high-difficulty rounds`,
        weeks: advancedWeeks,
        materials: resources.slice(0, 5).map((r) => ({ title: r.title, type: r.type, cost: r.cost })),
      },
    ];
  };

  const companyResources = selectedCompanyInfo ? getResourcesForCompany(selectedCompanyInfo) : RESOURCES_BY_TYPE;
  const selectedRoadmapResource =
    companyResources.find((r) => r.title === selectedResourceTitle) || companyResources[0] || RESOURCES_BY_TYPE[0];

  const getBackLabel = () => {
    if (view === 'companies') return 'Back to Dashboard';
    if (view === 'company-detail') return 'Back to Companies';
    return 'Back to Company';
  };

  const handleTopBack = () => {
    if (view === 'companies') {
      onBack();
      return;
    }
    if (view === 'company-detail') {
      setSelectedCompany(null);
      setView('companies');
      return;
    }
    setView('company-detail');
  };

  const filteredCompanies = Object.values(ALL_COMPANIES).filter((c) => categoryFilter === 'All' || c.category === categoryFilter);

  const renderCompanyGrid = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {(['All', 'FAANG', 'AI', 'FinTech', 'Startup', 'Enterprise', 'Chinese Tech'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full transition-colors ${
              categoryFilter === cat ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
            <CompanyLogo company={company} className="w-14 h-14 mb-3" />
            <h3 className="font-bold text-white text-sm text-center">{company.name}</h3>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">{company.category}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCompanyDetail = () => {
    if (!selectedCompany) return null;
    const company = ALL_COMPANIES[selectedCompany];

    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <CompanyLogo company={company} className="w-16 h-16" />
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
              <p className="text-sm font-bold text-blue-300">{company.category}</p>
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
                  <div className="bg-gradient-to-r from-blue-500 to-rose-500 h-2 rounded-full" style={{ width: `${weight}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setView('dsa-topics')}
            className="glass-panel rounded-lg p-3 hover:bg-blue-500/10 transition-colors text-center"
          >
            <p className="font-bold text-white text-xs">Topics</p>
          </button>
          <button
            onClick={() => setView('timeline')}
            className="glass-panel rounded-lg p-3 hover:bg-blue-500/10 transition-colors text-center"
          >
            <p className="font-bold text-white text-xs">Timeline</p>
          </button>
          <button
            onClick={() => setView('roadmap')}
            className="glass-panel rounded-lg p-3 hover:bg-green-500/10 transition-colors text-center"
          >
            <p className="font-bold text-white text-xs">Roadmap</p>
          </button>
          <button
            onClick={() => setView('resources')}
            className="glass-panel rounded-lg p-3 hover:bg-yellow-500/10 transition-colors text-center"
          >
            <p className="font-bold text-white text-xs">Resources</p>
          </button>
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">
          {selectedCompanyInfo ? `${selectedCompanyInfo.name} Preparation Timelines` : 'Interview Preparation Timelines'}
        </h3>

        <div className="space-y-6">
          {(selectedCompanyInfo ? buildCompanyTimelinePaths(selectedCompanyInfo) : TIMELINE_PATHS).map((path) => (
            <div key={path.level} className="border-l-4 border-blue-500 pl-6 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white capitalize">{path.level} Path</h4>
                  <p className="text-slate-300 text-sm">{path.days} Days | {path.description}</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg px-4 py-2 whitespace-nowrap">
                  <p className="text-blue-300 font-bold">{path.days} Days</p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <h5 className="font-bold text-white mb-3">Recommended Materials</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {path.materials.map((material) => (
                    <div key={material.title} className="bg-slate-800 rounded p-3 text-sm">
                      <p className="font-semibold text-white">{material.title}</p>
                      <p className="text-slate-400 text-xs">{material.type} | {material.cost}</p>
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
                        <strong className="text-blue-300">Week {week.week}:</strong> {week.topics.join(' | ')}
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
        Back
      </button>
    </div>
  );

  const renderDSATopics = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">
          {selectedCompanyInfo ? `${selectedCompanyInfo.name} Exact Focus Topics` : 'Complete DSA Learning Path'}
        </h3>
        <div className="space-y-4">
          {(selectedCompanyInfo ? buildCompanySpecificRoadmap(selectedCompanyInfo) : DSA_TOPICS_ROADMAP).map((week) => (
            <div key={week.week} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl font-bold text-blue-500">W{week.week}</span>
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
        Back
      </button>
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">
          {selectedCompanyInfo ? `${selectedCompanyInfo.name} Course-Based Roadmap` : 'Course-Based Roadmap'}
        </h3>

        {selectedCompanyInfo && selectedRoadmapResource && (
          <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400">Select Course/Resource</p>
              <select
                value={selectedRoadmapResource.title}
                onChange={(e) => setSelectedResourceTitle(e.target.value)}
                className="mt-2 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
              >
                {companyResources.map((resource) => (
                  <option key={resource.title} value={resource.title}>{resource.title}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-200">Estimated Timeline</p>
              <p className="text-lg font-bold text-blue-100 mt-1">
                {selectedRoadmapResource.durationWeeks} weeks (~{Math.ceil(selectedRoadmapResource.durationWeeks / 4)} months)
              </p>
              <p className="text-xs text-slate-300 mt-1">{selectedRoadmapResource.description}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(selectedCompanyInfo && selectedRoadmapResource
            ? buildCourseDrivenRoadmap(selectedCompanyInfo, selectedRoadmapResource)
            : DSA_TOPICS_ROADMAP
          ).map((week) => (
            <div key={week.week} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <p className="text-blue-200 font-bold mb-2">Week {week.week}: {week.phase}</p>
              <p className="text-sm text-slate-300"><strong>Topics:</strong> {week.topics.join(', ')}</p>
              <p className="text-sm text-slate-300 mt-1"><strong>Resources:</strong> {week.resources.join(', ')}</p>
              <p className="text-sm text-slate-300 mt-1"><strong>Practice:</strong> {week.practiceProblems} problems</p>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setView('company-detail')}
        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
      >
        Back
      </button>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">
          {selectedCompanyInfo ? `${selectedCompanyInfo.name} Recommended Resources` : 'Learning Resources'}
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          Select a resource to drive timeline and roadmap duration.
        </p>

        <div className="space-y-4">
          {companyResources.map((resource) => (
            <div key={resource.title} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{resource.title}</p>
                  <p className="text-sm text-slate-300 mt-1">{resource.description}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {resource.type} • {resource.cost} • {resource.durationWeeks} weeks (~{Math.ceil(resource.durationWeeks / 4)} months)
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => { setSelectedResourceTitle(resource.title); setView('roadmap'); }}
                    className={`px-3 py-2 rounded text-sm ${selectedRoadmapResource?.title === resource.title ? 'bg-blue-600 text-white' : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'}`}
                  >
                    Use for Roadmap
                  </button>
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
        Back
      </button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">MNC DSA Prep Hub</h1>
        <button
          onClick={handleTopBack}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          {getBackLabel()}
        </button>
      </div>

      <div className="glass-panel rounded-lg p-6">
        <p className="text-slate-300">
          Master Data Structures and Algorithms with company-specific learning paths. Choose from 200 top MNC and trending companies to see their interview patterns, DSA topics, and preparation roadmaps.
        </p>
        <p className="text-slate-400 text-sm mt-2">Total Companies: <strong className="text-blue-300">{Object.keys(ALL_COMPANIES).length}</strong> - FAANG, AI, FinTech, Startups & More</p>
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





