import { createClient } from '@supabase/supabase-js';
import type { Database } from '@supabase/supabase-js';

/**
 * Centralized database service for Supabase integration
 * Handles all database operations, pooling, and query builders
 */

interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class DatabaseService {
  private supabaseUrl: string;
  private anonKey: string;
  private serviceRoleKey?: string;
  private anonClient: ReturnType<typeof createClient>;
  private adminClient?: ReturnType<typeof createClient>;

  constructor(config: DatabaseConfig) {
    this.supabaseUrl = config.url;
    this.anonKey = config.anonKey;
    this.serviceRoleKey = config.serviceRoleKey;

    // Initialize anonymous client (for user operations)
    this.anonClient = createClient(this.supabaseUrl, this.anonKey);

    // Initialize admin client if service role key provided
    if (this.serviceRoleKey) {
      this.adminClient = createClient(this.supabaseUrl, this.serviceRoleKey);
    }
  }

  /**
   * Get anonymous client for user-level operations
   */
  getClient() {
    return this.anonClient;
  }

  /**
   * Get admin client for privileged operations
   */
  getAdminClient() {
    if (!this.adminClient) {
      throw new Error('Admin client not configured. Provide SUPABASE_SERVICE_ROLE_KEY');
    }
    return this.adminClient;
  }

  // ============= PROBLEMS =============

  /**
   * Get paginated list of problems with filters
   */
  async listProblems(options: {
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    topic?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { difficulty, topic, search, page = 1, pageSize = 50 } = options;

    let query = this.anonClient.from('problems').select('*').eq('visibility', 'public');

    // Apply filters
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }
    if (search) {
      query = query.textSearch('title', search, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await query
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list problems: ${error.message}`);

    return {
      problems: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Get problem by ID with test cases
   */
  async getProblemWithCases(problemId: string) {
    const { data, error } = await this.anonClient
      .rpc('get_problem_with_cases', { p_problem_id: problemId });

    if (error) throw new Error(`Failed to get problem: ${error.message}`);
    return data?.[0] || null;
  }

  /**
   * Create a new problem (admin only)
   */
  async createProblem(problem: {
    unique_id: string;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    tags: string[];
    statement: string;
    constraints: string[];
    mode: 'function' | 'stdin';
    starter_code: Record<string, string>;
    function_name?: string;
  }) {
    const { data, error } = await this.getAdminClient()
      .from('problems')
      .insert([problem])
      .select()
      .single();

    if (error) throw new Error(`Failed to create problem: ${error.message}`);
    return data;
  }

  // ============= TEST CASES =============

  /**
   * Add test cases to a problem
   */
  async addTestCases(
    problemId: string,
    testCases: Array<{
      input: any;
      expected_output: string;
      explanation?: string;
      order: number;
    }>
  ) {
    const { data, error } = await this.getAdminClient()
      .from('test_cases')
      .insert(testCases.map((tc) => ({ ...tc, problem_id: problemId })))
      .select();

    if (error) throw new Error(`Failed to add test cases: ${error.message}`);
    return data;
  }

  // ============= CODE SUBMISSIONS =============

  /**
   * Create a new code submission
   */
  async createSubmission(submission: {
    user_id: string;
    problem_id: string;
    language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
    code: string;
    status: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'pending';
    verdict?: string;
    runtime_ms?: number;
    memory_used?: number;
  }) {
    const { data, error } = await this.anonClient
      .from('code_submissions')
      .insert([submission])
      .select()
      .single();

    if (error) throw new Error(`Failed to create submission: ${error.message}`);
    return data;
  }

  /**
   * Get user's submissions for a problem
   */
  async getUserProblemSubmissions(userId: string, problemId: string) {
    const { data, error } = await this.anonClient
      .from('code_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .order('submitted_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
    return data || [];
  }

  /**
   * Get user's submission statistics
   */
  async getUserSubmissionStats(userId: string) {
    const { data, error } = await this.anonClient
      .from('code_submissions')
      .select('status, COUNT(*)')
      .eq('user_id', userId)
      .group_by('status');

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

    const stats = {
      total: 0,
      accepted: 0,
      wrongAnswer: 0,
      timeLimitExceeded: 0,
      runtimeError: 0,
      compilationError: 0,
    };

    (data || []).forEach((row: any) => {
      stats.total += row.count;
      if (row.status === 'AC') stats.accepted += row.count;
      else if (row.status === 'WA') stats.wrongAnswer += row.count;
      else if (row.status === 'TLE') stats.timeLimitExceeded += row.count;
      else if (row.status === 'RE') stats.runtimeError += row.count;
      else if (row.status === 'CE') stats.compilationError += row.count;
    });

    return stats;
  }

  /**
   * Update submission with results
   */
  async updateSubmissionResult(
    submissionId: string,
    result: {
      status: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
      verdict: string;
      runtime_ms: number;
      memory_used?: number;
      hidden_test_results?: any;
    }
  ) {
    const { data, error } = await this.anonClient
      .from('code_submissions')
      .update(result)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update submission: ${error.message}`);
    return data;
  }

  // ============= JUDGE JOBS =============

  /**
   * Enqueue a job in Redis (via API endpoint)
   * This is called by frontend to submit code for execution
   */
  async enqueueJob(job: {
    user_id?: string;
    problem_id?: string;
    language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
    mode: 'function' | 'stdin';
    code: string;
  }) {
    const { data, error } = await this.anonClient
      .from('judge_jobs')
      .insert([{ ...job, status: 'pending' }])
      .select()
      .single();

    if (error) throw new Error(`Failed to enqueue job: ${error.message}`);
    return data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const { data, error } = await this.anonClient
      .from('judge_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw new Error(`Failed to get job status: ${error.message}`);
    return data;
  }

  // ============= USER STATS VIEW =============

  /**
   * Get user's problem progress (solved, attempted, etc.)
   */
  async getUserProblemProgress(userId: string) {
    const { data, error } = await this.anonClient
      .rpc('get_user_problem_progress', { p_user_id: userId });

    if (error) throw new Error(`Failed to get progress: ${error.message}`);
    return data || [];
  }

  // ============= DISCUSSIONS =============

  /**
   * Get discussions for a problem
   */
  async getProblemDiscussions(
    problemId: string,
    options: { page?: number; pageSize?: number } = {}
  ) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await this.anonClient
      .from('discussions')
      .select('*')
      .eq('problem_id', problemId)
      .order('upvotes', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to fetch discussions: ${error.message}`);

    return {
      discussions: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * Create a discussion post
   */
  async createDiscussion(discussion: {
    problem_id: string;
    user_id: string;
    title: string;
    body: string;
    category: 'question' | 'solution' | 'discussion';
  }) {
    const { data, error } = await this.anonClient
      .from('discussions')
      .insert([discussion])
      .select()
      .single();

    if (error) throw new Error(`Failed to create discussion: ${error.message}`);
    return data;
  }

  // ============= BATCH OPERATIONS =============

  /**
   * Bulk insert problems (for seeding)
   * Admin only
   */
  async bulkInsertProblems(problems: any[]) {
    const chunkSize = 100; // Insert in chunks to avoid rate limits
    const results = [];

    for (let i = 0; i < problems.length; i += chunkSize) {
      const chunk = problems.slice(i, i + chunkSize);
      const { data, error } = await this.getAdminClient()
        .from('problems')
        .insert(chunk)
        .select();

      if (error) throw new Error(`Failed to insert batch ${i}-${i + chunkSize}: ${error.message}`);
      results.push(...(data || []));
    }

    return results;
  }

  // ============= TRANSACTION HELPERS =============

  /**
   * Execute a function inside a transaction
   * This provides atomic operations for complex multi-step tasks
   */
  async withTransaction<T>(
    callback: (client: ReturnType<typeof createClient>) => Promise<T>
  ): Promise<T> {
    try {
      // Note: Supabase doesn't have explicit transaction control via JS client
      // This is a placeholder for when you migrate to raw PostgreSQL or use stored procedures
      return await callback(this.anonClient);
    } catch (error) {
      throw error;
    }
  }

  // ============= HEALTH CHECK =============

  /**
   * Check database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.anonClient.from('problems').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// Initialize with environment variables
const DB = new DatabaseService({
  url: process.env.VITE_SUPABASE_URL || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export default DB;
export { DatabaseService };
