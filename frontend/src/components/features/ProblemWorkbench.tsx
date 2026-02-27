import React, { useEffect, useMemo, useState } from 'react';
import { CodingProblem, JudgeResponse, PlagiarismCheckResult, UserProfile } from '@shared/types';
import { getQueuedJudgeStatus, runCode, submitCodeToQueue } from '../../services/judgeService';
import { createSubmission } from '../../services/practiceService';
import { getHintTiers, getPracticeAnswerTemplate, getProblemById, getProblemCountLive, listProblemSummaries } from '../../services/problemLibraryService';
import { compareLastTwo, getAllCodeSubmissions, getSubmissionHistory, recordCodeSubmission } from '../../services/codeIntegrityService';

interface Props {
  user: UserProfile;
  allowHard: boolean;
  focusProblemId?: string | null;
  scopedProblemIds?: string[] | null;
  scopeLabel?: string | null;
  singleProblemMode?: boolean;
  onTrackedSubmission: () => Promise<void>;
  onSubmitted?: (problem: CodingProblem, result: JudgeResponse) => void;
}

type Language = 'javascript' | 'python' | 'java' | 'c' | 'cpp';
type Tab = 'Description' | 'Editorial' | 'Solutions' | 'Discuss';

const badgeClasses: Record<'Easy' | 'Medium' | 'Hard', string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-rose-100 text-rose-700',
};

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Atlassian', 'Uber', 'Flipkart', 'Razorpay'];
const getCompany = (id: string) => COMPANIES[Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COMPANIES.length];

const ProblemWorkbench: React.FC<Props> = ({ user, allowHard, focusProblemId, scopedProblemIds, scopeLabel, singleProblemMode = false, onTrackedSubmission, onSubmitted }) => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [companyFilter, setCompanyFilter] = useState<'All' | string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Todo' | 'Solved' | 'Attempted'>('All');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState<Tab>('Description');
  const [language, setLanguage] = useState<Language>('javascript');
  const [codeByProblem, setCodeByProblem] = useState<Record<string, Partial<Record<Language, string>>>>({});
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [runResult, setRunResult] = useState<JudgeResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [plagiarism, setPlagiarism] = useState<PlagiarismCheckResult | null>(null);
  const [queueJobId, setQueueJobId] = useState('');
  const [scoreMode, setScoreMode] = useState<'practice' | 'scored'>('scored');
  const [hintTier, setHintTier] = useState<0 | 1 | 2 | 3>(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  const [tabSwitches, setTabSwitches] = useState(0);
  const [pasteEvents, setPasteEvents] = useState(0);
  const [keyStrokes, setKeyStrokes] = useState(0);
  const [focusLostMs, setFocusLostMs] = useState(0);
  const [lastBlurAt, setLastBlurAt] = useState<number | null>(null);
  const [lastTypeAt, setLastTypeAt] = useState<number | null>(null);
  const [avgKeyIntervalMs, setAvgKeyIntervalMs] = useState(0);
  const [sessionStartedAt] = useState(Date.now());

  const pageSize = 25;
  const totals = getProblemCountLive();
  const listingRaw = useMemo(() => listProblemSummaries({ difficulty, query: search, page: 1, pageSize: 3000, allowHard: true }), [difficulty, search]);
  const solvedSet = useMemo(() => new Set(getAllCodeSubmissions(user.email).filter((x) => x.status === 'accepted').map((x) => x.problemId)), [user.email, result?.status]);
  const attemptedSet = useMemo(() => new Set(getAllCodeSubmissions(user.email).map((x) => x.problemId)), [user.email, result?.status]);

  const listingFiltered = useMemo(() => {
    return listingRaw.items.filter((item) => {
      const scopeOk = !scopedProblemIds || scopedProblemIds.includes(item.id);
      const companyOk = companyFilter === 'All' || getCompany(item.id) === companyFilter;
      const status = solvedSet.has(item.id) ? 'Solved' : attemptedSet.has(item.id) ? 'Attempted' : 'Todo';
      const statusOk = statusFilter === 'All' || statusFilter === status;
      return scopeOk && companyOk && statusOk;
    });
  }, [listingRaw.items, companyFilter, statusFilter, solvedSet, attemptedSet, scopedProblemIds]);

  const listing = useMemo(() => {
    const start = (page - 1) * pageSize;
    return { total: listingFiltered.length, items: listingFiltered.slice(start, start + pageSize) };
  }, [listingFiltered, page]);

  const selected = useMemo(() => {
    if (!selectedId && listing.items[0]) return getProblemById(listing.items[0].id);
    return selectedId ? getProblemById(selectedId) : null;
  }, [selectedId, listing.items]);

  useEffect(() => {
    if (!focusProblemId) return;
    const problem = getProblemById(focusProblemId);
    if (problem) setSelectedId(problem.id);
  }, [focusProblemId]);

  useEffect(() => {
    if (!scopedProblemIds || scopedProblemIds.length === 0) return;
    if (!selectedId || !scopedProblemIds.includes(selectedId)) setSelectedId(scopedProblemIds[0]);
  }, [scopedProblemIds, selectedId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setTabSwitches((x) => x + 1);
    };
    const onBlur = () => setLastBlurAt(Date.now());
    const onFocus = () => {
      if (lastBlurAt) setFocusLostMs((x) => x + (Date.now() - lastBlurAt));
      setLastBlurAt(null);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [lastBlurAt]);

  const currentCode = selected ? codeByProblem[selected.id]?.[language] || selected.starterCode[language] : '';
  const history = selected ? getSubmissionHistory(selected.id, user.email).slice(0, 5) : [];
  const latestDiff = selected ? compareLastTwo(selected.id, user.email) : [];
  const hints = selected ? getHintTiers(selected) : [];

  const setCurrentCode = (value: string) => {
    if (!selected) return;
    const now = Date.now();
    if (lastTypeAt) {
      const interval = now - lastTypeAt;
      setAvgKeyIntervalMs((prev) => (prev === 0 ? interval : Math.round(prev * 0.85 + interval * 0.15)));
    }
    setLastTypeAt(now);
    setKeyStrokes((x) => x + 1);
    setCodeByProblem((prev) => ({ ...prev, [selected.id]: { ...(prev[selected.id] || {}), [language]: value } }));
  };

  const runJudge = async (isSubmit: boolean) => {
    if (!selected) return;
    try {
      setError('');
      setRunning(true);
      if (isSubmit) {
        setResult(null);
        setPlagiarism(null);
      } else {
        setRunResult(null);
      }
      setQueueJobId('');
      setShowPracticeAnswer(false);

      if (!allowHard && selected.difficulty === 'Hard') throw new Error('Hard problems are visible but locked on your current plan.');

      const telemetry = {
        tabSwitches, pasteEvents, keyStrokes, avgKeyIntervalMs, focusLostMs,
        userAgentHash: btoa(navigator.userAgent).slice(0, 32),
        sessionStartedAt, submittedAt: Date.now(),
      };

      const tests = customInput.trim()
        ? [{ input: [customInput], expected: customExpected || '' }]
        : selected.testCases;

      const judge = isSubmit && scoreMode === 'scored'
        ? await (async () => {
            const queued = await submitCodeToQueue({ code: currentCode, language, testCases: tests, mode: selected.mode, functionName: selected.functionName, telemetry });
            setQueueJobId(queued.jobId);
            for (let i = 0; i < 45; i++) {
              const status = await getQueuedJudgeStatus(queued.jobId);
              if (status?.status === 'completed' && status?.result) return status.result as JudgeResponse;
              if (status?.status === 'failed') throw new Error(status?.error || 'queue worker failed');
              await new Promise((r) => setTimeout(r, 650));
            }
            throw new Error('Queue timeout: worker did not complete in time.');
          })()
        : await runCode(currentCode, language, tests, selected.mode, selected.functionName);

      setConsoleOutput(`stdout: ${judge.stdout ?? ''}\nexpected: ${tests[0]?.expected ?? ''}`);

      if (!isSubmit) {
        setRunResult(judge);
        return;
      }

      setResult(judge);
      if (judge.status === 'accepted' && !history.some((h) => h.status === 'accepted')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2200);
      }

      await createSubmission(user, {
        problemTitle: selected.title,
        topic: selected.topic,
        difficulty: selected.difficulty,
        status: judge.status === 'accepted' ? 'solved' : 'attempted',
        notes: `Mode=${scoreMode} Verdict=${judge.verdict || judge.status} Tests=${judge.passed}/${judge.total} runtime=${judge.runtimeMs}ms`,
      });

      if (scoreMode === 'scored') {
        const integrity = recordCodeSubmission(user, {
          problemId: selected.id,
          language,
          code: currentCode,
          status: judge.status,
          passed: judge.passed,
          total: judge.total,
          runtimeMs: judge.runtimeMs,
          antiCheatRisk: judge.antiCheat?.riskScore,
          antiCheatFlags: judge.antiCheat?.flags || [],
        });
        setPlagiarism(integrity.plagiarism);
      } else {
        setShowPracticeAnswer(true);
      }

      onSubmitted?.(selected, judge);
      await onTrackedSubmission();
    } catch (err: any) {
      setError(err?.message || 'Judge request failed. Start with npm run dev:all and npm run dev:runner.');
    } finally {
      setRunning(false);
    }
  };

  if (!selected) return <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-600">No problems available.</div>;
  const totalPages = Math.max(1, Math.ceil(listing.total / pageSize));
  const company = getCompany(selected.id);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {!singleProblemMode && (
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Problems</h3>
        <p className="text-xs text-slate-600">Catalog: Easy {totals.Easy} · Medium {totals.Medium} · Hard {totals.Hard}</p>
        {scopeLabel && <p className="text-xs text-orange-700 font-semibold">{scopeLabel}</p>}
        <div className="flex gap-2">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search problems" className="border border-slate-300 rounded px-3 py-2 text-sm" />
          <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value as any); setPage(1); }} className="border border-slate-300 rounded px-2 py-2 text-sm"><option value="All">All</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>
          <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }} className="border border-slate-300 rounded px-2 py-2 text-sm"><option value="All">All Companies</option>{COMPANIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="border border-slate-300 rounded px-2 py-2 text-sm"><option value="All">All Status</option><option value="Todo">Todo</option><option value="Solved">Solved</option><option value="Attempted">Attempted</option></select>
          <button onClick={() => {
            const random = listingFiltered[Math.floor(Math.random() * Math.max(1, listingFiltered.length))];
            if (random) setSelectedId(random.id);
          }} className="px-3 py-2 text-xs rounded border border-orange-300 text-orange-700 hover:bg-orange-50">Random Pick</button>
        </div>
      </div>
      )}

      {singleProblemMode && scopeLabel && (
        <div className="text-xs text-orange-700 font-semibold">{scopeLabel}</div>
      )}

      <div className={`grid grid-cols-1 ${singleProblemMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-3`}>
        {!singleProblemMode && (
        <div className="lg:col-span-3 space-y-2 max-h-[760px] overflow-auto pr-1">
          {listing.items.map((item) => (
            <button key={item.id} onClick={() => { setSelectedId(item.id); setResult(null); setRunResult(null); setError(''); setPlagiarism(null); setTab('Description'); }} className={`w-full text-left border rounded-lg p-3 ${selected.id === item.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{item.title}</p>
                <div className="flex items-center gap-1">
                  {!allowHard && item.difficulty === 'Hard' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white">Premium</span>}
                  <span className={`text-xs px-2 py-1 rounded ${badgeClasses[item.difficulty]}`}>{item.difficulty}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">{item.topic} Â· {getCompany(item.id)}</p>
            </button>
          ))}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
            <span>Page {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
        )}

        <div className={`${singleProblemMode ? '' : 'lg:col-span-9'} grid grid-cols-1 lg:grid-cols-2 gap-3`}>
          <div className="border border-slate-200 rounded-lg p-3 overflow-auto max-h-[760px]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">{selected.title}</h4>
              <span className={`text-xs px-2 py-1 rounded ${badgeClasses[selected.difficulty]}`}>{selected.difficulty}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Company: {company}</p>
            <div className="flex gap-2 mt-3">
              {(['Description', 'Editorial', 'Solutions', 'Discuss'] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-2 py-1 text-xs rounded border ${tab === t ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{t}</button>
              ))}
            </div>

            {tab === 'Description' && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-700">{selected.statement}</p>
                <div className="text-xs text-slate-600 space-y-1">{selected.constraints.map((c) => <p key={c}>- {c}</p>)}</div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-slate-600">Hints</span>
                  {[1, 2, 3].map((tier) => <button key={tier} onClick={() => setHintTier(tier as any)} className={`px-2 py-1 text-xs rounded border ${hintTier === tier ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Tier {tier}</button>)}
                </div>
                {hintTier > 0 && <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800"><p className="font-semibold">{hints[hintTier - 1]?.label}</p><p className="mt-1">{hints[hintTier - 1]?.content}</p></div>}
              </div>
            )}
            {tab === 'Editorial' && (
              <div className="mt-3 text-sm text-slate-700 space-y-2">
                <p className="font-semibold">Approach 1: Baseline</p>
                <p>Build a straightforward solution and validate constraints first.</p>
                <p className="font-semibold">Approach 2: Optimized</p>
                <p>Apply {selected.topic}-specific optimization to reduce complexity.</p>
                <p className="text-xs text-slate-500">Complexity target depends on input size; optimize for linear/near-linear when possible.</p>
              </div>
            )}
            {tab === 'Solutions' && (
              <div className="mt-3 text-sm text-slate-700 space-y-3">
                <div className="border border-slate-200 rounded p-2"><p className="font-semibold">Top JS Solution Â· +128</p><pre className="text-xs mt-1 whitespace-pre-wrap">Use map/window strategy with single pass.</pre></div>
                <div className="border border-slate-200 rounded p-2"><p className="font-semibold">Python Clean Approach Â· +92</p><pre className="text-xs mt-1 whitespace-pre-wrap">Use dict / deque as needed; parse input carefully.</pre></div>
              </div>
            )}
            {tab === 'Discuss' && (
              <div className="mt-3 text-sm text-slate-700 space-y-2">
                <div className="border border-slate-200 rounded p-2"><p className="font-semibold">Thread #1</p><p className="text-xs">Edge case on empty input? anyone validated?</p></div>
                <div className="border border-slate-200 rounded p-2"><p className="font-semibold">Thread #2</p><p className="text-xs">Best way to optimize memory for this one.</p></div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-slate-600">Language</label>
                <select className="border border-slate-300 rounded px-2 py-1.5 text-sm" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  <option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="c">C</option><option value="cpp">C++</option>
                </select>
                <label className="text-sm text-slate-600 ml-3">Mode</label>
                <select className="border border-slate-300 rounded px-2 py-1.5 text-sm" value={scoreMode} onChange={(e) => setScoreMode(e.target.value as any)}>
                  <option value="scored">Scored</option><option value="practice">Practice (No score)</option>
                </select>
                <button onClick={() => setCurrentCode(selected.starterCode[language])} className="ml-auto text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">Reset Code</button>
              </div>
              <textarea value={currentCode} onChange={(e) => setCurrentCode(e.target.value)} onPaste={() => setPasteEvents((x) => x + 1)} className="code-editor w-full min-h-[320px] mt-2 border border-slate-700 bg-slate-950 text-slate-100 rounded-lg p-3 font-mono text-sm" spellCheck={false} />
              <div className="mt-2 flex gap-2">
                <button onClick={() => runJudge(false)} disabled={running || (!allowHard && selected.difficulty === 'Hard')} className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60">Run Code</button>
                <button onClick={() => runJudge(true)} disabled={running || (!allowHard && selected.difficulty === 'Hard')} className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60">Submit</button>
              </div>
              {!allowHard && selected.difficulty === 'Hard' && <p className="text-xs text-amber-700 mt-1">Hard problem locked for current plan.</p>}
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-slate-900">Testcase Console</p>
              <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Custom stdin input" className="w-full mt-2 min-h-[80px] border border-slate-300 rounded p-2 text-xs font-mono text-slate-900" />
              <input value={customExpected} onChange={(e) => setCustomExpected(e.target.value)} placeholder="Expected output (optional for run)" className="w-full mt-2 border border-slate-300 rounded p-2 text-xs text-slate-900" />
              <pre className="mt-2 bg-slate-950 text-slate-100 rounded p-2 text-xs min-h-[70px] whitespace-pre-wrap">{consoleOutput || 'Output panel (stdout / expected / actual) appears here.'}</pre>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-slate-900">Result</p>
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              {queueJobId && <p className="text-xs text-slate-500 mt-1">Queue Job: {queueJobId}</p>}
              {runResult && <p className="text-xs text-slate-700 mt-1">Run: {runResult.verdict || runResult.status} Â· {runResult.passed}/{runResult.total}</p>}
              {result && (
                <div className="mt-2 text-sm">
                  <p className={`${result.status === 'accepted' ? 'text-emerald-700' : 'text-amber-700'} font-semibold`}>{result.verdict || result.status} Â· {result.passed}/{result.total}</p>
                  <p className="text-xs text-slate-600 mt-1">Runtime {result.runtimeMs}ms (beats {result.percentileRuntime || 0}%) Â· Memory beats {result.percentileMemory || 0}%</p>
                  {result.failingCaseIndex !== undefined && <p className="text-xs text-red-600 mt-1">Failed testcase #{result.failingCaseIndex + 1}</p>}
                  {result.antiCheat && <p className={`text-xs mt-1 ${result.antiCheat.riskScore >= 60 ? 'text-red-600' : 'text-slate-500'}`}>Anti-cheat risk {result.antiCheat.riskScore}% {result.antiCheat.flags.length ? `| ${result.antiCheat.flags.join(', ')}` : ''}</p>}
                </div>
              )}
              {showConfetti && <p className="text-green-600 mt-2">ðŸŽ‰ First AC on this problem!</p>}
              {plagiarism && <p className={`text-xs mt-2 ${plagiarism.flagged ? 'text-red-700' : 'text-emerald-700'}`}>Plagiarism similarity {plagiarism.similarity}% {plagiarism.flagged ? '(flagged)' : '(ok)'}</p>}
              {showPracticeAnswer && <pre className="mt-2 whitespace-pre-wrap text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-800">{getPracticeAnswerTemplate(selected, language)}</pre>}
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-slate-900">Recent Submissions</p>
              <div className="text-xs text-slate-600 mt-1 space-y-1">
                {history.map((h) => <p key={h.id}>{new Date(h.createdAt).toLocaleString()} Â· {h.language} Â· {h.status} Â· {h.passed}/{h.total}</p>)}
                {history.length === 0 && <p>No history for this problem yet.</p>}
              </div>
              {latestDiff.length > 0 && <p className="text-xs text-slate-500 mt-2">Last diff: {latestDiff.join(' | ')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemWorkbench;

