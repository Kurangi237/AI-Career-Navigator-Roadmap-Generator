import Redis from 'redis';
import { v4 as uuid } from 'uuid';
import { dockerJudge } from './execute-docker';
import type { JudgeQueueJob, JudgeResponse } from '@shared/types';

/**
 * Worker pool manager
 * Handles claiming jobs from Redis queue, executing them, and reporting results
 */

const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export class WorkerPool {
  private workerId: string;
  private isHealthy: boolean = true;
  private jobsProcessed: number = 0;
  private errorCount: number = 0;

  constructor(private workerCount: number = 1) {
    this.workerId = uuid().substring(0, 8);
  }

  /**
   * Start worker pool
   */
  async start() {
    console.log(`[WorkerPool] Starting with ${this.workerCount} workers (ID: ${this.workerId})`);

    await redis.connect();

    // Health check endpoint
    this.startHealthCheck();

    // Start worker processes
    for (let i = 0; i < this.workerCount; i++) {
      this.runWorker(i);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(`[WorkerPool] Shutting down gracefully...`);
    try {
      await redis.quit();
    } catch (e) {
      console.error('Redis shutdown error:', e);
    }
  }

  /**
   * Single worker process - claims and executes jobs
   */
  private async runWorker(workerId: number) {
    console.log(`[Worker-${workerId}] Started`);

    while (this.isHealthy) {
      try {
        // Claim next job from queue
        const job = await this.claimNextJob();

        if (!job) {
          // No jobs, wait and retry
          await this.sleep(1000);
          continue;
        }

        console.log(`[Worker-${workerId}] Claimed job ${job.id}`);

        // Update job status to running
        await this.updateJobStatus(job.id, 'running');

        // Execute job
        const result = await this.executeJob(job);

        // Report completion
        await this.completeJob(job.id, result);

        this.jobsProcessed++;
        console.log(`[Worker-${workerId}] Completed job ${job.id}`);
      } catch (error) {
        this.errorCount++;
        console.error(`[Worker-${workerId}] Error:`, error);
        await this.sleep(500); // Back off on error
      }
    }
  }

  /**
   * Claim next job from Redis queue
   */
  private async claimNextJob(): Promise<JudgeQueueJob | null> {
    try {
      // Use LPOP to get first job from queue
      const jobJson = await redis.lPop('judge:queue');

      if (!jobJson) return null;

      const job = JSON.parse(jobJson) as JudgeQueueJob;
      return job;
    } catch (error) {
      console.error('[WorkerPool] Error claiming job:', error);
      return null;
    }
  }

  /**
   * Execute job using Docker judge
   */
  private async executeJob(job: JudgeQueueJob): Promise<JudgeResponse> {
    try {
      const response = await dockerJudge.executeInDocker({
        id: job.id,
        language: job.language,
        code: job.code,
        mode: job.mode,
        testCases: job.testCases,
        functionName: job.functionName,
        timeout: 5000,
      });

      return response;
    } catch (error) {
      return {
        passed: 0,
        total: job.testCases.length,
        results: [],
        status: 'error',
        runtimeMs: 0,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  /**
   * Update job status in Redis
   */
  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      await redis.hSet(`judge:job:${jobId}`, 'status', status);
      await redis.hSet(`judge:job:${jobId}`, 'updatedAt', String(Date.now()));
    } catch (error) {
      console.error('[WorkerPool] Error updating job status:', error);
    }
  }

  /**
   * Mark job as complete with result
   */
  private async completeJob(jobId: string, result: JudgeResponse): Promise<void> {
    try {
      const jobKey = `judge:job:${jobId}`;

      // Store result
      await redis.hSet(jobKey, 'result', JSON.stringify(result));
      await redis.hSet(jobKey, 'status', 'completed');
      await redis.hSet(jobKey, 'completedAt', String(Date.now()));

      // Set expiration (24 hours) so results don't pile up
      await redis.expire(jobKey, 86400);

      console.log(`[WorkerPool] Job ${jobId} completed and stored`);
    } catch (error) {
      console.error('[WorkerPool] Error completing job:', error);
    }
  }

  /**
   * Start health check endpoint
   */
  private startHealthCheck() {
    // Express middleware can check
    // GET /health/worker returns { status, workerId, jobsProcessed, errorCount }
  }

  /**
   * Get worker health status
   */
  getHealth() {
    return {
      workerId: this.workerId,
      healthy: this.isHealthy,
      jobsProcessed: this.jobsProcessed,
      errorCount: this.errorCount,
      errorRate: this.jobsProcessed > 0 ? this.errorCount / this.jobsProcessed : 0,
    };
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export for immediate use
export const workerPool = new WorkerPool(
  parseInt(process.env.JUDGE_WORKER_COUNT || '2', 10)
);
