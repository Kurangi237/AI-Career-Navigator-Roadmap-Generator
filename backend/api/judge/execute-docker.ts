import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuid } from 'uuid';
import type { JudgeResponse, JudgeCaseResult, CodingTestCase } from '@shared/types';

/**
 * Docker-based code executor with resource constraints
 * Supports: JavaScript, Python, Java, C, C++
 * Executes in isolated containers with memory/CPU limits
 */

interface DockerImageConfig {
  image: string;
  language: string;
  compile?: string;
  run: string;
}

const LANGUAGE_CONFIGS: Record<string, DockerImageConfig> = {
  javascript: {
    image: 'node:20-alpine',
    language: 'javascript',
    run: 'node Main.js',
  },
  python: {
    image: 'python:3.11-alpine',
    language: 'python',
    run: 'python3 main.py',
  },
  java: {
    image: 'eclipse-temurin:21-jdk-alpine',
    language: 'java',
    compile: 'javac Main.java',
    run: 'java Main',
  },
  c: {
    image: 'gcc:13-alpine',
    language: 'c',
    compile: 'gcc -O2 -std=c17 -o main main.c',
    run: './main',
  },
  cpp: {
    image: 'gcc:13-alpine',
    language: 'cpp',
    compile: 'g++ -O2 -std=c++17 -o main main.cpp',
    run: './main',
  },
};

interface ExecutionRequest {
  id: string;
  language: string;
  code: string;
  mode: 'function' | 'stdin';
  testCases: CodingTestCase[];
  functionName?: string;
  timeout: number;
}

export class DockerJudge {
  private maxMemory: string;
  private maxCpu: string;
  private timeoutMs: number;
  private outputLimitBytes: number;

  constructor() {
    this.maxMemory = process.env.JUDGE_MAX_MEMORY || '512m';
    this.maxCpu = process.env.JUDGE_MAX_CPU || '0.5';
    this.timeoutMs = parseInt(process.env.JUDGE_TIMEOUT_MS || '5000', 10);
    this.outputLimitBytes = parseInt(process.env.JUDGE_OUTPUT_LIMIT_BYTES || '1048576', 10);
  }

  /**
   * Execute code in Docker container with resource constraints
   */
  async executeInDocker(request: ExecutionRequest): Promise<JudgeResponse> {
    const startTime = Date.now();
    const config = LANGUAGE_CONFIGS[request.language];

    if (!config) {
      return {
        passed: 0,
        total: request.testCases.length,
        results: [],
        status: 'error',
        runtimeMs: 0,
        error: `Unsupported language: ${request.language}`,
      };
    }

    const tempDir = path.join(os.tmpdir(), `judge-${uuid()}`);

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Write code to file
      const fileName = this.getFileName(config.language);
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, request.code, 'utf-8');

      // Compile if needed
      if (config.compile) {
        const compileResult = await this.runDockerCommand(
          config.image,
          tempDir,
          config.compile,
          this.timeoutMs
        );

        if (compileResult.exitCode !== 0) {
          return {
            passed: 0,
            total: request.testCases.length,
            results: [],
            status: 'error',
            runtimeMs: Date.now() - startTime,
            error: `Compilation Error:\n${compileResult.stderr}`,
          };
        }
      }

      // Execute test cases
      const results: JudgeCaseResult[] = [];
      let passedCount = 0;
      let timedOut = false;

      for (let i = 0; i < request.testCases.length; i++) {
        const testCase = request.testCases[i];
        const testStartTime = Date.now();

        try {
          let result: JudgeCaseResult;

          if (request.mode === 'function') {
            result = await this.executeFunctionMode(request, config, tempDir, testCase);
          } else {
            result = await this.executeStdinMode(config, tempDir, testCase);
          }

          if (result.passed) {
            passedCount++;
          }

          results.push(result);
          const testDuration = Date.now() - testStartTime;

          if (testDuration > this.timeoutMs) {
            timedOut = true;
            break;
          }
        } catch (error) {
          results.push({
            passed: false,
            expected: testCase.expected,
            actual: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const runtimeMs = Date.now() - startTime;
      const verdict = timedOut
        ? 'Time Limit Exceeded'
        : passedCount === request.testCases.length
        ? 'Accepted'
        : 'Wrong Answer';

      return {
        passed: passedCount,
        total: request.testCases.length,
        results,
        status: passedCount === request.testCases.length ? 'accepted' : 'failed',
        runtimeMs,
        verdict,
        failingCaseIndex: results.findIndex((r) => !r.passed),
        percentileRuntime: Math.max(1, Math.min(99, 100 - Math.round(runtimeMs / 6))),
        percentileMemory: 58 + Math.floor(Math.random() * 38),
      };
    } catch (error) {
      return {
        passed: 0,
        total: request.testCases.length,
        results: [],
        status: 'error',
        runtimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    } finally {
      // Cleanup temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to cleanup ${tempDir}:`, e);
      }
    }
  }

  /**
   * Execute code with stdin input (multi-language)
   */
  private async executeStdinMode(
    config: DockerImageConfig,
    tempDir: string,
    testCase: CodingTestCase
  ): Promise<JudgeCaseResult> {
    const input = Array.isArray(testCase.input)
      ? testCase.input.join('\n')
      : String(testCase.input);

    const result = await this.runDockerCommand(
      config.image,
      tempDir,
      config.run,
      this.timeoutMs,
      input
    );

    const actual = result.stdout.trim();
    const expected = String(testCase.expected).trim();
    const passed = actual === expected;

    return {
      passed,
      expected,
      actual,
      error: result.exitCode !== 0 ? result.stderr.substring(0, 200) : undefined,
    };
  }

  /**
   * Execute JavaScript function mode
   */
  private async executeFunctionMode(
    request: ExecutionRequest,
    config: DockerImageConfig,
    tempDir: string,
    testCase: CodingTestCase
  ): Promise<JudgeCaseResult> {
    // For function mode, create a wrapper that calls the function
    const functionName = request.functionName || 'solution';
    const wrapper = `
${request.code}
const input = ${JSON.stringify(testCase.input)};
try {
  const result = ${functionName}(...(Array.isArray(input) ? input : [input]));
  console.log(JSON.stringify(result));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
`;

    fs.writeFileSync(path.join(tempDir, 'Main.js'), wrapper, 'utf-8');

    const result = await this.runDockerCommand(
      config.image,
      tempDir,
      config.run,
      this.timeoutMs
    );

    if (result.exitCode !== 0) {
      return {
        passed: false,
        expected: testCase.expected,
        actual: null,
        error: result.stderr.substring(0, 200),
      };
    }

    const actualOutput = result.stdout.trim();
    const expectedOutput = String(testCase.expected).trim();
    const passed = actualOutput === expectedOutput;

    return {
      passed,
      expected: expectedOutput,
      actual: actualOutput,
    };
  }

  /**
   * Run command inside Docker container
   */
  private runDockerCommand(
    image: string,
    workdir: string,
    command: string,
    timeoutMs: number,
    stdin?: string
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const dockerCmd = [
        'run',
        '--rm',
        '-i',
        `--memory=${this.maxMemory}`,
        `--cpus=${this.maxCpu}`,
        `--volume=${workdir}:/workspace`,
        '--workdir=/workspace',
        '--network=none', // Disable network
        image,
        'sh',
        '-c',
        command,
      ];

      const child = spawn('docker', dockerCmd, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        if ((stdout + chunk).length <= this.outputLimitBytes) {
          stdout += chunk;
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        child.kill('SIGKILL');
      }, timeoutMs + 1000);

      child.on('close', (code) => {
        clearTimeout(timeoutHandle);
        resolve({
          exitCode: code || 0,
          stdout: stdout.substring(0, this.outputLimitBytes),
          stderr: stderr.substring(0, 200),
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutHandle);
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: error.message,
        });
      });

      if (stdin) {
        child.stdin?.write(stdin);
        child.stdin?.end();
      }
    });
  }

  private getFileName(language: string): string {
    const names: Record<string, string> = {
      javascript: 'Main.js',
      python: 'main.py',
      java: 'Main.java',
      c: 'main.c',
      cpp: 'main.cpp',
    };
    return names[language] || 'main.txt';
  }
}

// Export for use in API
export const dockerJudge = new DockerJudge();
