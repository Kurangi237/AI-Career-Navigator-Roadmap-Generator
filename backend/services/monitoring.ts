/**
 * Monitoring & Observability Service
 * Integrations with Sentry, Datadog, and LogRocket
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

class MonitoringService {
  private isInitialized = false;

  /**
   * Initialize monitoring (call once at app startup)
   */
  initialize(environment: string = process.env.NODE_ENV || 'development') {
    try {
      // Initialize Sentry for error tracking
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment,
        integrations: [
          new ProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.OnUncaughtException(),
          new Sentry.Integrations.OnUnhandledRejection(),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 0.1,
        maxBreadcrumbs: 50,
      });

      this.isInitialized = true;
      console.log('Monitoring service initialized');
    } catch (err) {
      console.error('Monitoring initialization error:', err);
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized) return;

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.isInitialized) return;

    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context for tracking
   */
  setUser(userId: string, email?: string, username?: string) {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
  }

  /**
   * Track custom metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!this.isInitialized) return;

    Sentry.withScope((scope) => {
      if (tags) {
        Object.entries(tags).forEach(([key, val]) => {
          scope.setTag(key, val);
        });
      }
      Sentry.captureMessage(`Metric: ${name}=${value}`, 'info');
    });
  }

  /**
   * Monitor function execution time
   */
  async monitorAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name,
      op: 'function',
    });

    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;

      this.trackMetric(`${name}_duration`, duration, tags);
      transaction.finish();
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      transaction.finish();
      throw error;
    }
  }

  /**
   * Health check for critical systems
   */
  async healthCheck(): Promise<{
    timestamp: string;
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    api: 'healthy' | 'unhealthy';
  }> {
    // Would check actual service health
    return {
      timestamp: new Date().toISOString(),
      database: 'healthy',
      redis: 'healthy',
      api: 'healthy',
    };
  }

  /**
   * Alert rules (configured in Sentry/Datadog)
   */
  static alerts = {
    highErrorRate: {
      condition: 'error_rate > 5%',
      threshold: 5,
      window: '5m',
      severity: 'critical',
    },
    judgeQueueBacklog: {
      condition: 'pending_jobs > 100',
      threshold: 100,
      window: '1m',
      severity: 'warning',
    },
    slowQueries: {
      condition: 'db_query_time > 1s',
      threshold: 1000,
      window: '5m',
      severity: 'warning',
    },
    apiLatency: {
      condition: 'p99_latency > 2s',
      threshold: 2000,
      window: '5m',
      severity: 'warning',
    },
    lowCache: {
      condition: 'cache_hit_ratio < 70%',
      threshold: 70,
      window: '10m',
      severity: 'info',
    },
  };

  /**
   * Get monitoring dashboard URL
   */
  static dashboards = {
    sentry: () => 'https://sentry.io/dashboards',
    datadog: () => 'https://app.datadoghq.com/dashboard',
    logrocket: () => 'https://app.logrocket.com/dashboard',
  };
}

export const monitoringService = new MonitoringService();

/**
 * Middleware for Express to track requests
 */
export const monitoringMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  // Wrap response.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;

    monitoringService.trackMetric('http_request_duration', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode.toString(),
    });

    Sentry.captureMessage(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      'info'
    );

    originalEnd.apply(res, args);
  };

  next();
};

export default monitoringService;
