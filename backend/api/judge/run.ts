import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import vm from 'node:vm';

const EXEC_TIMEOUT_MS = 4000;
const USE_DOCKER = process.env.JUDGE_USE_DOCKER === 'true';

const normalize = (v: any) => {
  if (typeof v === 'string') return v.trim();
  return JSON.stringify(v);
};

const assessAntiCheat = (telemetry: any, runtimeMs: number) => {
  if (!telemetry) {
    return { riskScore: 0, flags: [], fingerprint: 'n/a' };
  }

  let risk = 0;
  const flags: string[] = [];
  if (telemetry.pasteEvents > 8) { risk += 24; flags.push('high_paste_activity'); }
  if (telemetry.tabSwitches > 12) { risk += 22; flags.push('frequent_tab_switching'); }
  if (telemetry.focusLostMs > 90_000) { risk += 18; flags.push('long_focus_loss'); }
  if (telemetry.keyStrokes < 15 && telemetry.pasteEvents > 0) { risk += 15; flags.push('low_typing_high_paste'); }
  if (telemetry.avgKeyIntervalMs > 0 && telemetry.avgKeyIntervalMs < 18) { risk += 10; flags.push('unnatural_typing_cadence'); }
  if (runtimeMs < 20 && telemetry.keyStrokes < 20) { risk += 12; flags.push('suspiciously_fast_submission'); }

  return {
    riskScore: Math.min(100, risk),
    flags,
    fingerprint: telemetry.userAgentHash || 'unknown',
  };
};

const runProcess = (
  command: string,
  args: string[],
  cwd: string,
  stdin = '',
  timeoutMs = EXEC_TIMEOUT_MS,
): Promise<{ stdout: string; stderr: string; code: number | null }> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: timedOut ? `${stderr}\n[timeout]` : stderr, code });
    });
    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
};

const runJsFunctionMode = async (code: string, functionName: string, testCases: any[], telemetry?: any) => {
  const wrappedCode = `
${code}
if (typeof ${functionName} !== 'function') {
  throw new Error('Function "${functionName}" not found.');
}
globalThis.__candidate = ${functionName};
`;
  const context: any = { globalThis: {}, console: { log: () => {} } };
  vm.createContext(context);
  const boot = new vm.Script(wrappedCode);
  const start = Date.now();
  boot.runInContext(context, { timeout: 1200 });
  const candidate = context.globalThis.__candidate;

  const results = testCases.map((test: any) => {
    try {
      const actual = candidate(...(Array.isArray(test.input) ? test.input : []));
      const passed = normalize(actual) === normalize(test.expected);
      return { passed, expected: test.expected, actual };
    } catch (error: any) {
      return { passed: false, expected: test.expected, actual: null, error: error?.message || 'runtime error' };
    }
  });
  const passed = results.filter((x: any) => x.passed).length;
  const total = results.length;
  const failingCaseIndex = results.findIndex((x: any) => !x.passed);
  const verdict = passed === total ? 'Accepted' : results.some((x: any) => x.error) ? 'Runtime Error' : 'Wrong Answer';
  return {
    passed,
    total,
    results,
    status: passed === total ? 'accepted' : 'failed',
    runtimeMs: Date.now() - start,
    antiCheat: assessAntiCheat(telemetry, Date.now() - start),
    verdict,
    failingCaseIndex: failingCaseIndex >= 0 ? failingCaseIndex : undefined,
    percentileRuntime: Math.max(1, Math.min(99, 100 - Math.round((Date.now() - start) / 4))),
    percentileMemory: 60 + Math.floor(Math.random() * 35),
    stdout: '',
  };
};

type FileConfig = {
  file: string;
  compile: null | [string, string[]];
  run: [string, string[]];
};

const getFileConfig = (language: string): FileConfig => {
  switch (language) {
    case 'javascript':
      return { file: 'Main.js', run: ['node', ['Main.js']], compile: null };
    case 'python':
      return { file: 'main.py', run: ['python', ['main.py']], compile: null };
    case 'java':
      return {
        file: 'Main.java',
        compile: ['javac', ['Main.java']],
        run: ['java', ['Main']],
      };
    case 'c':
      return {
        file: 'main.c',
        compile: ['gcc', ['main.c', '-O2', '-std=c17', '-o', 'main']],
        run: [process.platform === 'win32' ? 'main.exe' : './main', []],
      };
    case 'cpp':
      return {
        file: 'main.cpp',
        compile: ['g++', ['main.cpp', '-O2', '-std=c++17', '-o', 'main']],
        run: [process.platform === 'win32' ? 'main.exe' : './main', []],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const getDockerConfig = (language: string) => {
  switch (language) {
    case 'javascript':
      return { image: 'node:20-alpine', compile: '', run: 'node Main.js' };
    case 'python':
      return { image: 'python:3.11-alpine', compile: '', run: 'python3 main.py' };
    case 'java':
      return { image: 'eclipse-temurin:21-jdk', compile: 'javac Main.java', run: 'java Main' };
    case 'c':
      return { image: 'gcc:13', compile: 'gcc main.c -O2 -std=c17 -o main', run: './main' };
    case 'cpp':
      return { image: 'gcc:13', compile: 'g++ main.cpp -O2 -std=c++17 -o main', run: './main' };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const runDocker = async (
  image: string,
  script: string,
  cwd: string,
  stdin = '',
) => {
  return runProcess(
    'docker',
    ['run', '--rm', '-i', '-v', `${cwd}:/workspace`, '-w', '/workspace', image, 'sh', '-lc', script],
    cwd,
    stdin,
  );
};

const runStdinMode = async (language: string, code: string, testCases: any[], telemetry?: any) => {
  const cfg = getFileConfig(language);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'judge-'));
  const started = Date.now();
  try {
    await fs.writeFile(path.join(tempDir, cfg.file), code, 'utf8');

    if (USE_DOCKER) {
      const dockerCfg = getDockerConfig(language);
      if (dockerCfg.compile) {
        const compileOut = await runDocker(dockerCfg.image, dockerCfg.compile, tempDir);
        if (compileOut.code !== 0) {
          return {
            passed: 0,
            total: testCases.length,
            results: testCases.map((t: any) => ({
              passed: false,
              expected: t.expected,
              actual: '',
              error: (compileOut.stderr || compileOut.stdout || 'compilation failed').trim(),
            })),
            status: 'error',
            runtimeMs: Date.now() - started,
          };
        }
      }
    } else if (cfg.compile) {
      const [compileCmd, compileArgs] = cfg.compile;
      const compileOut = await runProcess(compileCmd, compileArgs, tempDir);
      if (compileOut.code !== 0) {
        return {
          passed: 0,
          total: testCases.length,
          results: testCases.map((t: any) => ({
            passed: false,
            expected: t.expected,
            actual: '',
            error: (compileOut.stderr || compileOut.stdout || 'compilation failed').trim(),
          })),
          status: 'error',
          runtimeMs: Date.now() - started,
        };
      }
    }

    const [runCmd, runArgs] = cfg.run;
    const dockerCfg = USE_DOCKER ? getDockerConfig(language) : null;
    const results = [];
    for (const t of testCases) {
      const input = Array.isArray(t.input) ? String(t.input[0] ?? '') : '';
      const out = USE_DOCKER
        ? await runDocker(dockerCfg!.image, dockerCfg!.run, tempDir, input)
        : await runProcess(runCmd, runArgs, tempDir, input);
      const actual = (out.stdout || '').trim();
      const expected = normalize(t.expected);
      const passed = out.code === 0 && normalize(actual) === expected;
      const isTimeout = /\[timeout\]/i.test(out.stderr || '');
      results.push({
        passed,
        expected: t.expected,
        actual,
        error: out.code === 0 ? undefined : isTimeout ? 'Time limit exceeded' : (out.stderr || out.stdout || `exit ${out.code}`).trim(),
      });
    }

    const passed = results.filter((x) => x.passed).length;
    const failingCaseIndex = results.findIndex((x) => !x.passed);
    const hasTimeout = results.some((x) => /time limit exceeded/i.test(x.error || ''));
    const hasRuntime = results.some((x) => x.error && !/time limit exceeded/i.test(x.error));
    const verdict = passed === results.length ? 'Accepted' : hasTimeout ? 'Time Limit Exceeded' : hasRuntime ? 'Runtime Error' : 'Wrong Answer';
    return {
      passed,
      total: results.length,
      results,
      status: passed === results.length ? 'accepted' : 'failed',
      runtimeMs: Date.now() - started,
      antiCheat: assessAntiCheat(telemetry, Date.now() - started),
      verdict,
      failingCaseIndex: failingCaseIndex >= 0 ? failingCaseIndex : undefined,
      percentileRuntime: Math.max(1, Math.min(99, 100 - Math.round((Date.now() - started) / 6))),
      percentileMemory: 58 + Math.floor(Math.random() * 38),
      stdout: results[failingCaseIndex >= 0 ? failingCaseIndex : 0]?.actual || '',
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

export const executeJudge = async (payload: any) => {
  const { code, functionName, testCases, language = 'javascript', mode = 'stdin', telemetry } = payload || {};
  if (!code || !Array.isArray(testCases)) {
    throw new Error('missing code/testCases');
  }
  if (mode === 'function') {
    if (!functionName) throw new Error('missing functionName for function mode');
    return runJsFunctionMode(code, functionName, testCases, telemetry);
  }
  return runStdinMode(language, code, testCases, telemetry);
};

export default async function handler(req: any, res: any) {
  try {
    const out = await executeJudge(req.body || {});
    return res.status(200).json(out);
  } catch (err: any) {
    return res.status(200).json({
      passed: 0,
      total: 0,
      results: [],
      status: 'error',
      runtimeMs: 0,
      error: err?.message || 'judge error',
    });
  }
}
