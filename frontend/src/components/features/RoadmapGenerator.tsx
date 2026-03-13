import React, { useState } from 'react';
import { generateRoadmap } from '../../services/geminiService';
import { saveRoadmapToStorage } from '../../services/storageService';
import { RoadmapResponse } from '@shared/types';

interface Props {
  onBack: () => void;
}

const GOAL_WEEKS: Record<string, number> = {
  '1 month': 4,
  '2 months': 8,
  '3 months': 12,
  '6 months': 24,
};

const TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Full Stack Developer',
  'React Developer',
  'Node.js Developer',
  'Data Analyst',
  'Data Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity Engineer',
  'Software Test Engineer',
];

type NormalizedWeek = {
  week: number;
  topic: string;
  project: string;
  resources: Array<{ title: string; link: string }>;
};

type RoleModule = {
  topic: string;
  project: string;
  resources: Array<{ title: string; link: string }>;
};

type CoursePath = {
  id: string;
  label: string;
  track: 'frontend' | 'backend' | 'devops';
  modules: RoleModule[];
};

const ROLE_MODULES: Record<string, RoleModule[]> = {
  frontend: [
    { topic: 'HTML, CSS, JavaScript Fundamentals', project: 'Build responsive landing page', resources: [{ title: 'W3Schools HTML', link: 'https://www.w3schools.com/html/' }, { title: 'W3Schools CSS', link: 'https://www.w3schools.com/css/' }, { title: 'GFG JavaScript Tutorial', link: 'https://www.geeksforgeeks.org/javascript/' }] },
    { topic: 'DOM, Events, and Browser APIs', project: 'Build interactive to-do app', resources: [{ title: 'W3Schools JavaScript', link: 'https://www.w3schools.com/js/' }, { title: 'HackerRank 10 Days of JS', link: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' }, { title: 'GFG DOM Tutorial', link: 'https://www.geeksforgeeks.org/dom-document-object-model/' }] },
    { topic: 'React Components and Props', project: 'Build multi-page React app', resources: [{ title: 'W3Schools React', link: 'https://www.w3schools.com/react/' }, { title: 'LeetCode Problem Set', link: 'https://leetcode.com/problemset/' }, { title: 'GFG ReactJS Tutorial', link: 'https://www.geeksforgeeks.org/reactjs-tutorials/' }] },
    { topic: 'State Management and Data Fetching', project: 'Build dashboard with API integration', resources: [{ title: 'GFG React Hooks', link: 'https://www.geeksforgeeks.org/reactjs-hooks/' }, { title: 'HackerRank REST API Challenges', link: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' }, { title: 'W3Schools Fetch API', link: 'https://www.w3schools.com/js/js_api_fetch.asp' }] },
    { topic: 'TypeScript for Frontend', project: 'Refactor app with typed state flows', resources: [{ title: 'JavaTpoint TypeScript', link: 'https://www.tpointtech.com/typescript-tutorial' }, { title: 'GFG TypeScript Tutorial', link: 'https://www.geeksforgeeks.org/typescript/' }, { title: 'W3Schools TypeScript', link: 'https://www.w3schools.com/typescript/' }] },
    { topic: 'Testing and Debugging in Frontend', project: 'Add test suite and debug workflow', resources: [{ title: 'GFG React Testing', link: 'https://www.geeksforgeeks.org/testing-react-components/' }, { title: 'LeetCode Daily Challenges', link: 'https://leetcode.com/problemset/all/?difficulty=EASY' }, { title: 'HackerRank Problem Solving', link: 'https://www.hackerrank.com/domains/algorithms' }] },
    { topic: 'Performance and Accessibility', project: 'Optimize Lighthouse score above 90', resources: [{ title: 'W3Schools Accessibility', link: 'https://www.w3schools.com/accessibility/index.php' }, { title: 'GFG Web Performance', link: 'https://www.geeksforgeeks.org/website-performance-optimization/' }, { title: 'LeetCode String/Array Set', link: 'https://leetcode.com/problemset/?topicSlugs=array,string' }] },
    { topic: 'Deployment and CI/CD for Frontend', project: 'Deploy production app with CI pipeline', resources: [{ title: 'GFG GitHub Actions', link: 'https://www.geeksforgeeks.org/github-actions/' }, { title: 'W3Schools Git', link: 'https://www.w3schools.com/git/' }, { title: 'HackerRank Git Practice', link: 'https://www.hackerrank.com/domains/shell' }] },
  ],
  backend: [
    { topic: 'HTTP, REST APIs, and Server Basics', project: 'Build CRUD API service', resources: [{ title: 'GFG REST API Introduction', link: 'https://www.geeksforgeeks.org/rest-api-introduction/' }, { title: 'JavaTpoint RESTful Web Services', link: 'https://www.tpointtech.com/restful-web-services-tutorial' }, { title: 'HackerRank API Challenges', link: 'https://www.hackerrank.com/domains/algorithms' }] },
    { topic: 'Node.js/Java Backend Frameworks', project: 'Build layered service architecture', resources: [{ title: 'JavaTpoint Java Tutorial', link: 'https://www.tpointtech.com/java-tutorial' }, { title: 'GFG Node.js Tutorial', link: 'https://www.geeksforgeeks.org/nodejs/' }, { title: 'W3Schools Node.js', link: 'https://www.w3schools.com/nodejs/' }] },
    { topic: 'Databases and SQL Design', project: 'Design normalized schema and optimize queries', resources: [{ title: 'W3Schools SQL', link: 'https://www.w3schools.com/sql/' }, { title: 'GFG SQL Tutorial', link: 'https://www.geeksforgeeks.org/sql-tutorial/' }, { title: 'HackerRank SQL Practice', link: 'https://www.hackerrank.com/domains/sql' }] },
    { topic: 'Authentication and Authorization', project: 'Implement JWT + RBAC', resources: [{ title: 'GFG JWT Authentication', link: 'https://www.geeksforgeeks.org/jwt-authentication-with-node-js/' }, { title: 'JavaTpoint Spring Security', link: 'https://www.tpointtech.com/spring-security-tutorial' }, { title: 'LeetCode HashMap/Set', link: 'https://leetcode.com/problemset/?topicSlugs=hash-table' }] },
    { topic: 'Caching and Performance Optimization', project: 'Add Redis caching to APIs', resources: [{ title: 'GFG Redis Tutorial', link: 'https://www.geeksforgeeks.org/redis-tutorial/' }, { title: 'W3Schools Caching Concepts', link: 'https://www.w3schools.com/whatis/whatis_cache.asp' }, { title: 'LeetCode LRU Cache', link: 'https://leetcode.com/problems/lru-cache/' }] },
    { topic: 'Message Queues and Async Processing', project: 'Implement worker queue pipeline', resources: [{ title: 'GFG Message Queue Basics', link: 'https://www.geeksforgeeks.org/message-queues-system-design/' }, { title: 'JavaTpoint Kafka Tutorial', link: 'https://www.tpointtech.com/apache-kafka-tutorial' }, { title: 'HackerRank Data Structures', link: 'https://www.hackerrank.com/domains/data-structures' }] },
    { topic: 'Testing and Observability', project: 'Add API tests, logging, and monitoring', resources: [{ title: 'GFG Unit Testing', link: 'https://www.geeksforgeeks.org/unit-testing-software-testing/' }, { title: 'JavaTpoint JUnit Tutorial', link: 'https://www.tpointtech.com/junit-tutorial' }, { title: 'W3Schools HTTP Status', link: 'https://www.w3schools.com/tags/ref_httpmessages.asp' }] },
    { topic: 'Production Deployment', project: 'Containerize and deploy backend service', resources: [{ title: 'GFG Docker Tutorial', link: 'https://www.geeksforgeeks.org/docker-tutorial/' }, { title: 'JavaTpoint Docker', link: 'https://www.tpointtech.com/docker-tutorial' }, { title: 'HackerRank Linux Shell', link: 'https://www.hackerrank.com/domains/shell' }] },
  ],
  devops: [
    { topic: 'Linux, Networking, and Shell Scripting', project: 'Automate system setup scripts', resources: [{ title: 'GFG Linux Tutorial', link: 'https://www.geeksforgeeks.org/linux-tutorial/' }, { title: 'HackerRank Shell', link: 'https://www.hackerrank.com/domains/shell' }, { title: 'JavaTpoint Shell Scripting', link: 'https://www.tpointtech.com/linux-shell-scripting-tutorial' }] },
    { topic: 'Git Workflow and CI Basics', project: 'Set up CI for lint/test/build', resources: [{ title: 'W3Schools Git', link: 'https://www.w3schools.com/git/' }, { title: 'GFG GitHub Actions', link: 'https://www.geeksforgeeks.org/github-actions/' }, { title: 'HackerRank Git Practice', link: 'https://www.hackerrank.com/domains/shell' }] },
    { topic: 'Docker and Containerization', project: 'Containerize multi-service app', resources: [{ title: 'GFG Docker Tutorial', link: 'https://www.geeksforgeeks.org/docker-tutorial/' }, { title: 'JavaTpoint Docker Tutorial', link: 'https://www.tpointtech.com/docker-tutorial' }, { title: 'LeetCode Stack/Queue', link: 'https://leetcode.com/problemset/?topicSlugs=stack,queue' }] },
    { topic: 'Kubernetes Fundamentals', project: 'Deploy app on local k8s cluster', resources: [{ title: 'GFG Kubernetes Tutorial', link: 'https://www.geeksforgeeks.org/kubernetes-tutorial/' }, { title: 'JavaTpoint Kubernetes', link: 'https://www.tpointtech.com/kubernetes' }, { title: 'HackerRank Problem Solving', link: 'https://www.hackerrank.com/domains/algorithms' }] },
    { topic: 'Infrastructure as Code (Terraform)', project: 'Provision cloud infra with Terraform', resources: [{ title: 'GFG Terraform Intro', link: 'https://www.geeksforgeeks.org/terraform-an-introduction-and-installation/' }, { title: 'JavaTpoint Terraform', link: 'https://www.tpointtech.com/what-is-terraform' }, { title: 'W3Schools Cloud Intro', link: 'https://www.w3schools.com/whatis/whatis_cloudcomputing.asp' }] },
    { topic: 'Monitoring and Alerting', project: 'Set up Prometheus + Grafana alerts', resources: [{ title: 'GFG Monitoring in DevOps', link: 'https://www.geeksforgeeks.org/what-is-monitoring-in-devops/' }, { title: 'JavaTpoint Prometheus', link: 'https://www.tpointtech.com/devops' }, { title: 'HackerRank Linux Practice', link: 'https://www.hackerrank.com/domains/shell' }] },
    { topic: 'Cloud Services (AWS/Azure/GCP)', project: 'Deploy scalable cloud environment', resources: [{ title: 'GFG AWS Tutorial', link: 'https://www.geeksforgeeks.org/aws-amazon-web-services-tutorial/' }, { title: 'JavaTpoint AWS', link: 'https://www.tpointtech.com/aws-tutorial' }, { title: 'W3Schools Cloud Computing', link: 'https://www.w3schools.com/whatis/whatis_cloudcomputing.asp' }] },
    { topic: 'Security and Reliability Engineering', project: 'Implement secrets, backups, and DR plan', resources: [{ title: 'GFG DevSecOps', link: 'https://www.geeksforgeeks.org/devsecops/' }, { title: 'JavaTpoint Cyber Security', link: 'https://www.tpointtech.com/cyber-security-tutorial' }, { title: 'LeetCode Graph Problems', link: 'https://leetcode.com/problemset/?topicSlugs=graph' }] },
  ],
};

const COURSE_PATHS: CoursePath[] = [
  {
    id: 'frontend_react',
    label: 'Frontend React Path',
    track: 'frontend',
    modules: [
      { topic: 'HTML/CSS Layout + Responsive Design', project: 'Build responsive portfolio landing page', resources: [{ title: 'W3Schools HTML/CSS', link: 'https://www.w3schools.com/css/css_rwd_intro.asp' }, { title: 'GFG Responsive Web Design', link: 'https://www.geeksforgeeks.org/responsive-web-design/' }] },
      { topic: 'JavaScript ES6 + Browser Events', project: 'Build form validation and interactive components', resources: [{ title: 'W3Schools JavaScript', link: 'https://www.w3schools.com/js/' }, { title: 'HackerRank JS Challenges', link: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' }] },
      { topic: 'React Core + Component Architecture', project: 'Build multi-section React application', resources: [{ title: 'W3Schools React', link: 'https://www.w3schools.com/react/' }, { title: 'GFG React Tutorial', link: 'https://www.geeksforgeeks.org/reactjs-tutorials/' }] },
      { topic: 'React Router + API Integration', project: 'Build role-based dashboard with REST APIs', resources: [{ title: 'GFG React Router', link: 'https://www.geeksforgeeks.org/react-router-v6-a-complete-guide/' }, { title: 'W3Schools Fetch API', link: 'https://www.w3schools.com/js/js_api_fetch.asp' }] },
      { topic: 'State Management + TypeScript', project: 'Refactor app with typed state flows', resources: [{ title: 'JavaTpoint TypeScript', link: 'https://www.tpointtech.com/typescript-tutorial' }, { title: 'GFG TypeScript', link: 'https://www.geeksforgeeks.org/typescript/' }] },
      { topic: 'Testing, Performance, Deployment', project: 'Ship tested app to production', resources: [{ title: 'GFG React Testing', link: 'https://www.geeksforgeeks.org/testing-react-components/' }, { title: 'W3Schools Git', link: 'https://www.w3schools.com/git/' }] },
      { topic: 'Advanced UI Patterns + Forms', project: 'Build dynamic multi-step form workflow', resources: [{ title: 'W3Schools Forms', link: 'https://www.w3schools.com/html/html_forms.asp' }, { title: 'HackerRank Frontend Practice', link: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' }] },
      { topic: 'Auth Flow in Frontend Apps', project: 'Implement login/signup with protected routes', resources: [{ title: 'GFG Auth in React', link: 'https://www.geeksforgeeks.org/how-to-authenticate-user-in-reactjs/' }, { title: 'JavaTpoint JWT', link: 'https://www.tpointtech.com/spring-security-tutorial' }] },
      { topic: 'Component Reusability + Design System', project: 'Create reusable component library', resources: [{ title: 'W3Schools CSS Variables', link: 'https://www.w3schools.com/css/css3_variables.asp' }, { title: 'GFG Design System Basics', link: 'https://www.geeksforgeeks.org/design-system/' }] },
      { topic: 'Accessibility + SEO Basics', project: 'Audit and improve accessibility score', resources: [{ title: 'W3Schools Accessibility', link: 'https://www.w3schools.com/accessibility/index.php' }, { title: 'GFG SEO Basics', link: 'https://www.geeksforgeeks.org/what-is-search-engine-optimization-seo/' }] },
      { topic: 'Frontend Problem Solving + DSA', project: 'Solve 20 frontend-relevant coding tasks', resources: [{ title: 'LeetCode Arrays/Strings', link: 'https://leetcode.com/problemset/?topicSlugs=array,string' }, { title: 'HackerRank Algorithms', link: 'https://www.hackerrank.com/domains/algorithms' }] },
      { topic: 'Capstone Build + Portfolio Polish', project: 'Build and deploy final capstone with docs', resources: [{ title: 'W3Schools Hosting Overview', link: 'https://www.w3schools.com/whatis/whatis_webhosting.asp' }, { title: 'GFG Deployment Guide', link: 'https://www.geeksforgeeks.org/how-to-deploy-a-react-app/' }] },
    ],
  },
  {
    id: 'backend_node',
    label: 'Backend Node.js Path',
    track: 'backend',
    modules: [
      { topic: 'Node.js Fundamentals + Express', project: 'Build modular REST API', resources: [{ title: 'W3Schools Node.js', link: 'https://www.w3schools.com/nodejs/' }, { title: 'GFG Node.js', link: 'https://www.geeksforgeeks.org/nodejs/' }] },
      { topic: 'Data Modeling + SQL/NoSQL', project: 'Design schema and query optimization', resources: [{ title: 'W3Schools SQL', link: 'https://www.w3schools.com/sql/' }, { title: 'HackerRank SQL', link: 'https://www.hackerrank.com/domains/sql' }] },
      { topic: 'Auth, Security, Validation', project: 'Implement JWT auth and API validation', resources: [{ title: 'GFG JWT Node.js', link: 'https://www.geeksforgeeks.org/jwt-authentication-with-node-js/' }, { title: 'JavaTpoint JWT', link: 'https://www.tpointtech.com/spring-security-tutorial' }] },
      { topic: 'Caching + Background Jobs', project: 'Add Redis cache and worker queues', resources: [{ title: 'GFG Redis', link: 'https://www.geeksforgeeks.org/redis-tutorial/' }, { title: 'JavaTpoint Kafka', link: 'https://www.tpointtech.com/apache-kafka-tutorial' }] },
      { topic: 'Observability + Testing', project: 'Add logs, metrics, and API tests', resources: [{ title: 'JavaTpoint JUnit', link: 'https://www.tpointtech.com/junit-tutorial' }, { title: 'GFG Unit Testing', link: 'https://www.geeksforgeeks.org/unit-testing-software-testing/' }] },
      { topic: 'Containerization + Deployment', project: 'Deploy scalable backend on cloud', resources: [{ title: 'GFG Docker', link: 'https://www.geeksforgeeks.org/docker-tutorial/' }, { title: 'JavaTpoint Docker', link: 'https://www.tpointtech.com/docker-tutorial' }] },
      { topic: 'API Versioning + Documentation', project: 'Version APIs and generate docs', resources: [{ title: 'GFG API Versioning', link: 'https://www.geeksforgeeks.org/rest-api-versioning/' }, { title: 'W3Schools HTTP Methods', link: 'https://www.w3schools.com/tags/ref_httpmethods.asp' }] },
      { topic: 'Rate Limiting + Throttling', project: 'Add middleware for request limits', resources: [{ title: 'GFG Rate Limiting', link: 'https://www.geeksforgeeks.org/rate-limiting-in-system-design/' }, { title: 'HackerRank Algorithms', link: 'https://www.hackerrank.com/domains/algorithms' }] },
      { topic: 'Message Queue and Async Workers', project: 'Build async email/notification worker', resources: [{ title: 'GFG Message Queues', link: 'https://www.geeksforgeeks.org/message-queues-system-design/' }, { title: 'JavaTpoint RabbitMQ', link: 'https://www.tpointtech.com/get-started-with-rabbitmq-and-python' }] },
      { topic: 'Database Indexing and Performance', project: 'Tune queries and indexing strategy', resources: [{ title: 'GFG DB Indexing', link: 'https://www.geeksforgeeks.org/database-indexing/' }, { title: 'LeetCode Database Problems', link: 'https://leetcode.com/problemset/database/' }] },
      { topic: 'Backend DSA for Interviews', project: 'Solve 25 backend-relevant DSA problems', resources: [{ title: 'LeetCode Top Interview', link: 'https://leetcode.com/problem-list/top-interview-questions/' }, { title: 'HackerRank Data Structures', link: 'https://www.hackerrank.com/domains/data-structures' }] },
      { topic: 'Capstone Backend Architecture', project: 'Design and deploy production-grade API', resources: [{ title: 'GFG System Design Basics', link: 'https://www.geeksforgeeks.org/system-design-tutorial/' }, { title: 'JavaTpoint Microservices', link: 'https://www.tpointtech.com/microservices' }] },
    ],
  },
  {
    id: 'devops_k8s',
    label: 'DevOps Kubernetes Path',
    track: 'devops',
    modules: [
      { topic: 'Linux Administration + Shell Automation', project: 'Automate provisioning scripts', resources: [{ title: 'GFG Linux', link: 'https://www.geeksforgeeks.org/linux-tutorial/' }, { title: 'HackerRank Shell', link: 'https://www.hackerrank.com/domains/shell' }] },
      { topic: 'GitOps + CI Pipeline Design', project: 'Build end-to-end CI pipeline', resources: [{ title: 'W3Schools Git', link: 'https://www.w3schools.com/git/' }, { title: 'GFG GitHub Actions', link: 'https://www.geeksforgeeks.org/github-actions/' }] },
      { topic: 'Docker Images + Compose Workflows', project: 'Containerize multi-service application', resources: [{ title: 'GFG Docker', link: 'https://www.geeksforgeeks.org/docker-tutorial/' }, { title: 'JavaTpoint Docker', link: 'https://www.tpointtech.com/docker-tutorial' }] },
      { topic: 'Kubernetes Workloads + Networking', project: 'Deploy app with ingress and autoscaling', resources: [{ title: 'GFG Kubernetes', link: 'https://www.geeksforgeeks.org/kubernetes-tutorial/' }, { title: 'JavaTpoint Kubernetes', link: 'https://www.tpointtech.com/kubernetes' }] },
      { topic: 'Terraform + Cloud Infrastructure', project: 'Provision infra using reusable IaC modules', resources: [{ title: 'GFG Terraform', link: 'https://www.geeksforgeeks.org/terraform-an-introduction-and-installation/' }, { title: 'JavaTpoint Terraform', link: 'https://www.tpointtech.com/what-is-terraform' }] },
      { topic: 'Monitoring, Alerting, SRE Practices', project: 'Create dashboards and on-call runbooks', resources: [{ title: 'GFG Monitoring in DevOps', link: 'https://www.geeksforgeeks.org/what-is-monitoring-in-devops/' }, { title: 'JavaTpoint Prometheus', link: 'https://www.tpointtech.com/devops' }] },
      { topic: 'Cloud IAM + Security Controls', project: 'Implement least-privilege IAM strategy', resources: [{ title: 'GFG AWS IAM', link: 'https://www.geeksforgeeks.org/aws-identity-and-access-management-iam/' }, { title: 'JavaTpoint AWS Security', link: 'https://www.tpointtech.com/aws-tutorial' }] },
      { topic: 'Release Management + Rollbacks', project: 'Set up blue-green deployment pipeline', resources: [{ title: 'GFG Blue Green Deployment', link: 'https://www.geeksforgeeks.org/blue-green-deployment/' }, { title: 'W3Schools DevOps Intro', link: 'https://www.w3schools.com/whatis/whatis_devops.asp' }] },
      { topic: 'Log Aggregation + Incident Response', project: 'Implement central logging and incident SOP', resources: [{ title: 'GFG Log Monitoring', link: 'https://www.geeksforgeeks.org/log-monitoring-in-devops/' }, { title: 'HackerRank Shell Practice', link: 'https://www.hackerrank.com/domains/shell' }] },
      { topic: 'Cost Optimization and Capacity Planning', project: 'Optimize infra cost by right-sizing', resources: [{ title: 'GFG Cloud Cost Optimization', link: 'https://www.geeksforgeeks.org/cloud-cost-optimization/' }, { title: 'JavaTpoint Cloud Computing', link: 'https://www.tpointtech.com/cloud-computing' }] },
      { topic: 'DevOps Problem Solving + Automation', project: 'Solve 20 automation/infra coding tasks', resources: [{ title: 'LeetCode System Design', link: 'https://leetcode.com/problemset/' }, { title: 'HackerRank Algorithms', link: 'https://www.hackerrank.com/domains/algorithms' }] },
      { topic: 'Capstone DevOps Platform Delivery', project: 'Deliver full CI/CD + K8s + Monitoring stack', resources: [{ title: 'GFG DevOps Project Ideas', link: 'https://www.geeksforgeeks.org/devops-projects/' }, { title: 'JavaTpoint DevOps Tutorial', link: 'https://www.tpointtech.com/devops' }] },
    ],
  },
];

const detectTrack = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('devops') || r.includes('cloud') || r.includes('sre')) return 'devops';
  if (r.includes('frontend') || r.includes('react') || r.includes('ui')) return 'frontend';
  if (r.includes('backend') || r.includes('java') || r.includes('node')) return 'backend';
  return 'backend';
};

const getCoursePathsForRole = (role: string): CoursePath[] => {
  const track = detectTrack(role) as 'frontend' | 'backend' | 'devops';
  const scoped = COURSE_PATHS.filter((c) => c.track === track);
  return scoped.length ? scoped : COURSE_PATHS.filter((c) => c.track === 'backend');
};

const buildUniqueGeneratedWeeks = (
  role: string,
  targetWeeks: number,
  experienceLevel: string,
  availability: string,
  selectedCourseId: string
): NormalizedWeek[] => {
  const track = detectTrack(role);
  const selectedCourse = COURSE_PATHS.find((c) => c.id === selectedCourseId && c.track === track);
  const modules = selectedCourse?.modules || ROLE_MODULES[track];
  const level = experienceLevel.toLowerCase();
  const isIntensive = /20|40|full-time/i.test(availability);
  const levelTag = level === 'advanced' ? 'Advanced' : level === 'intermediate' ? 'Intermediate' : 'Beginner';
  const practiceLinks: Record<string, string> = {
    frontend: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript',
    backend: 'https://www.hackerrank.com/domains/data-structures',
    devops: 'https://www.hackerrank.com/domains/shell',
  };
  const dsaLinks: Record<string, string> = {
    frontend: 'https://leetcode.com/problemset/?topicSlugs=array,string',
    backend: 'https://leetcode.com/problem-list/top-interview-questions/',
    devops: 'https://leetcode.com/problemset/?topicSlugs=graph',
  };

  return Array.from({ length: targetWeeks }).map((_, idx) => {
    const hasModule = idx < modules.length;
    const module = hasModule ? modules[idx] : {
      topic: `${role} Interview Readiness Sprint ${idx - modules.length + 1}`,
      project: `Solve scenario-based case studies for ${role}`,
      resources: [
        { title: 'LeetCode Practice', link: dsaLinks[track] },
        { title: 'HackerRank Practice', link: practiceLinks[track] },
      ],
    };
    const topic = module.topic;
    const project = module.project;

    const weeklyProblems = isIntensive ? 8 + Math.floor(idx / 4) : 4 + Math.floor(idx / 4);
    const planResource = {
      title: `Weekly Plan (${levelTag}) - Week ${idx + 1}`,
      link: modules[Math.min(idx, modules.length - 1)]?.resources?.[0]?.link || practiceLinks[track],
    };
    const practiceResource = { title: `Practice Set (${weeklyProblems} tasks)`, link: practiceLinks[track] };
    const leetcodeResource = { title: 'LeetCode Targeted Set', link: dsaLinks[track] };

    return {
      week: idx + 1,
      topic,
      project,
      resources: [...(module.resources || []), planResource, practiceResource, leetcodeResource].slice(0, 4),
    };
  });
};

const normalizeRoadmapToWeeks = (
  result: RoadmapResponse,
  role: string,
  targetWeeks: number,
  experienceLevel: string,
  availability: string,
  selectedCourseId: string
): RoadmapResponse => {
  const normalizedWeeklyPlan = buildUniqueGeneratedWeeks(role, targetWeeks, experienceLevel, availability, selectedCourseId);

  return {
    ...(result as any),
    role: role || (result as any).role,
    duration_weeks: targetWeeks,
    weekly_plan: normalizedWeeklyPlan,
  } as RoadmapResponse;
};

const RoadmapGenerator: React.FC<Props> = ({ onBack }) => {
  const [role, setRole] = useState('');
  const [coursePathId, setCoursePathId] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('10 hours/week');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [goalTimeline, setGoalTimeline] = useState('3 months');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const coursePaths = getCoursePathsForRole(role || 'backend');
  const hasSelectedInTrack = coursePaths.some((c) => c.id === coursePathId);
  const effectiveCoursePathId = hasSelectedInTrack ? coursePathId : (coursePaths[0]?.id || '');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError('');
    setRoadmap(null);
    setSaved(false);

    try {
      const selectedCourse = coursePaths.find((c) => c.id === effectiveCoursePathId);
      const enrichedSkills = `${skills || 'Not specified'}\nExperience Level: ${experienceLevel}\nCourse Path: ${selectedCourse?.label || 'Auto'}`;
      const enrichedAvailability = `${availability}; Target Completion: ${goalTimeline}`;
      const result = await generateRoadmap(role, enrichedSkills, enrichedAvailability);
      const targetWeeks = GOAL_WEEKS[goalTimeline] || 12;
      const normalized = normalizeRoadmapToWeeks(result, role, targetWeeks, experienceLevel, availability, effectiveCoursePathId);
      setRoadmap(normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (roadmap) {
      saveRoadmapToStorage(roadmap);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 premium-page">
      {/* Main Form Section */}
      <div className="glass-panel p-8 rounded-xl shadow-sm border border-slate-700 premium-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-300 flex items-center">
            <span className="bg-blue-600 w-2 h-8 rounded-sm mr-3"></span>
            Generate Your Personalized Roadmap
          </h2>
          <button
            onClick={onBack}
            className="text-sm px-3 py-1.5 rounded border border-slate-500 text-slate-300 hover:bg-slate-700/40"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Java Full Stack Developer, React Developer..."
              list="target-role-options"
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
            <datalist id="target-role-options">
              {TARGET_ROLES.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2 pt-1">
              {TARGET_ROLES.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className="px-2 py-1 text-xs rounded border border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Time Availability Per Week</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option>5 hours/week</option>
              <option>10 hours/week</option>
              <option>20 hours/week</option>
              <option>Full-time (40h/week)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Course Path</label>
            <select
              value={effectiveCoursePathId}
              onChange={(e) => setCoursePathId(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              {coursePaths.map((course) => (
                <option key={course.id} value={course.id}>{course.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Current Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Target Completion Timeline</label>
            <select
              value={goalTimeline}
              onChange={(e) => setGoalTimeline(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option>1 month</option>
              <option>2 months</option>
              <option>3 months</option>
              <option>6 months</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-300">Current Skills (Optional)</label>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Basic HTML, Python knowledge, Excel, 2 years Java experience... (helps customize your roadmap)"
              className="w-full bg-slate-800/70 border border-slate-300 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/40'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Your Roadmap...
                </span>
              ) : 'Generate Personalized Roadmap'}
            </button>
          </div>
        </form>

        <p className="text-sm text-slate-400 mt-4 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
          Tip: The generated roadmap will customize the timeline and resources based on your role, availability, and skills.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          {error}
        </div>
      )}

      {roadmap && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between glass-panel p-4 rounded-lg shadow-sm border border-slate-700 premium-card">
             <div className="flex flex-col">
                <h3 className="text-xl font-bold text-slate-100">
                    Your Path to <span className="text-blue-300">{roadmap.role}</span>
                </h3>
                <span className="text-sm text-slate-400">{roadmap.duration_weeks} Weeks Estimated</span>
             </div>

             <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        saved
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    }`}
                >
                    {saved ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Saved!
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            Save Roadmap
                        </>
                    )}
                </button>
             </div>
          </div>

          <div className="relative border-l-2 border-blue-500 ml-4 space-y-8">
            {roadmap.weekly_plan.map((week, idx) => (
              <div key={idx} className="relative pl-8 pb-8 last:pb-0 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500"></div>

                <div className="glass-panel p-5 rounded-lg border border-slate-700 shadow-sm hover:shadow-md transition-all premium-card">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 block">
                    Week {week.week}
                  </span>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">{week.topic}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-800/70 p-3 rounded border border-slate-700">
                        <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Learn From (Click to Open)</p>
                        <ul className="space-y-2">
                          {week.resources.map((r, i) => (
                            <li key={i}>
                                <a
                                    href={r.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-300 hover:underline flex items-start gap-2"
                                >
                                    <span>{'->'}</span>
                                    <span>{r.title}</span>
                                </a>
                            </li>
                          ))}
                        </ul>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded border border-blue-200/40">
                        <p className="text-xs text-blue-200 mb-1 font-bold uppercase">Practical Project</p>
                        <p className="text-sm text-slate-300">{week.project}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapGenerator;






