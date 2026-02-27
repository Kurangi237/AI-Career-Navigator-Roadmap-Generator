import React, { useMemo, useRef, useState } from 'react';
import { analyzeDocument, sendChatMessage } from '../../services/geminiService';
import { SkillAnalysisResponse } from '@shared/types';
import { deleteSavedResumeDraft, getSavedResumeDrafts, saveResumeDraftToStorage, saveResumeScanToStorage, type ResumeDraft } from '../../services/storageService';

interface Props { onBack: () => void; }
type ResumeTab = 'analyzer' | 'builder';
type TemplateId = 'fresher' | 'experienced' | 'fullstack';

type BuilderState = {
  name: string; templateId: TemplateId; fullName: string; title: string; email: string; phone: string; location: string;
  links: string; summary: string; skills: string; experience: string; projects: string; education: string; certifications: string; achievements: string; jd: string;
};

const templates: Record<TemplateId, BuilderState> = {
  fresher: { name: 'Fresher Resume', templateId: 'fresher', fullName: 'Your Name', title: 'Software Engineer Intern', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'Motivated computer science student with strong DSA fundamentals and full stack project experience.', skills: 'C++, JavaScript, React, Node.js, SQL, Git', experience: 'Intern | ABC Tech | Jan 2025 - Mar 2025 | Built APIs; Improved response by 20%', projects: 'MNC DSA Prep Hub | React, Node.js | github.com/yourname/mnc-dsa-prep | Built DSA problem platform; Implemented judge system', education: 'B.Tech CSE | University Name | 2025 | 8.7 CGPA', certifications: 'Meta Front-End Developer', achievements: 'Solved 300+ DSA problems from top MNC interview patterns', jd: '' },
  experienced: { name: 'Experienced Resume', templateId: 'experienced', fullName: 'Your Name', title: 'Software Engineer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'Backend-focused engineer with production experience in scalable systems and performance optimization.', skills: 'Java, Spring Boot, PostgreSQL, Redis, Docker, AWS', experience: 'Software Engineer | Tech Company | Jan 2023 - Present | Built APIs serving 1M+ requests; Reduced latency by 35%', projects: 'Internal Analytics Tool | React, Java, PostgreSQL | | Built dashboard; Added role-based analytics', education: 'B.Tech CSE | University Name | 2022 | 8.5 CGPA', certifications: 'AWS Cloud Practitioner', achievements: 'Top 10% coding contests', jd: '' },
  fullstack: { name: 'Full Stack Resume', templateId: 'fullstack', fullName: 'Your Name', title: 'Full Stack Developer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname, portfolio.com', summary: 'Full stack developer building end-to-end products with strong frontend UX and backend reliability.', skills: 'React, TypeScript, Node.js, Express, MongoDB, PostgreSQL, Docker', experience: '', projects: 'Placement Tracker | React, Node.js, PostgreSQL | github.com/yourname/placement-tracker | Built dashboard; Added progress analytics', education: 'B.E IT | University Name | 2024 | 8.2 CGPA', certifications: '', achievements: '', jd: '' },
};

const splitCsv = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const textToLines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);
const clamp = (n: number) => Math.max(0, Math.min(100, n));

const toDraft = (b: BuilderState, id?: string): Omit<ResumeDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } => ({
  id, name: b.name, templateId: b.templateId, fullName: b.fullName, title: b.title, email: b.email, phone: b.phone, location: b.location,
  links: splitCsv(b.links), summary: b.summary, skills: splitCsv(b.skills),
  experience: textToLines(b.experience).map((line) => { const [role = '', company = '', duration = '', points = ''] = line.split('|').map((x) => x.trim()); return { role, company, duration, points: points.split(';').map((x) => x.trim()).filter(Boolean) }; }),
  projects: textToLines(b.projects).map((line) => { const [name = '', tech = '', link = '', points = ''] = line.split('|').map((x) => x.trim()); return { name, tech, link, points: points.split(';').map((x) => x.trim()).filter(Boolean) }; }),
  education: textToLines(b.education).map((line) => { const [degree = '', institute = '', year = '', score = ''] = line.split('|').map((x) => x.trim()); return { degree, institute, year, score }; }),
  certifications: splitCsv(b.certifications), achievements: splitCsv(b.achievements),
});

const fromDraft = (d: ResumeDraft): BuilderState => ({
  name: d.name, templateId: d.templateId as TemplateId, fullName: d.fullName, title: d.title, email: d.email, phone: d.phone, location: d.location,
  links: d.links.join(', '), summary: d.summary, skills: d.skills.join(', '),
  experience: d.experience.map((x) => `${x.role} | ${x.company} | ${x.duration} | ${x.points.join('; ')}`).join('\n'),
  projects: d.projects.map((x) => `${x.name} | ${x.tech} | ${x.link || ''} | ${x.points.join('; ')}`).join('\n'),
  education: d.education.map((x) => `${x.degree} | ${x.institute} | ${x.year} | ${x.score || ''}`).join('\n'),
  certifications: d.certifications.join(', '), achievements: d.achievements.join(', '), jd: '',
});

const ResumeAnalyzer: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<ResumeTab>('analyzer');
  const [builder, setBuilder] = useState<BuilderState>(templates.fresher);
  const [savedDraftId, setSavedDraftId] = useState('');
  const [savedStatus, setSavedStatus] = useState('');
  const [tailorLoading, setTailorLoading] = useState(false);
  const savedDrafts = useMemo(() => getSavedResumeDrafts(), [savedStatus]);

  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysisResponse | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!builder.fullName.trim()) m.push('Add full name');
    if (!builder.email.trim()) m.push('Add email');
    if (!builder.phone.trim()) m.push('Add phone');
    if (!builder.summary.trim() || builder.summary.trim().length < 60) m.push('Improve summary');
    if (splitCsv(builder.skills).length < 6) m.push('Add at least 6 skills');
    if (!builder.projects.trim()) m.push('Add at least one project');
    if (!builder.education.trim()) m.push('Add education section');
    return m;
  }, [builder]);

  const ats = useMemo(() => {
    const base = clamp(100 - missing.length * 10);
    const jdTerms = Array.from(new Set(builder.jd.toLowerCase().split(/[^a-z0-9+#.]+/).filter((x) => x.length > 2))).slice(0, 25);
    if (!jdTerms.length) return clamp(Math.round(base * 0.9 + 10));
    const text = JSON.stringify(builder).toLowerCase();
    const hits = jdTerms.filter((x) => text.includes(x)).length;
    return clamp(Math.round(base * 0.6 + (hits / jdTerms.length) * 40));
  }, [builder, missing]);

  const update = (k: keyof BuilderState, v: string) => setBuilder((p) => ({ ...p, [k]: v }));
  const setTemplate = (t: TemplateId) => { setBuilder(templates[t]); setSavedDraftId(''); };

  const saveDraft = () => {
    const saved = saveResumeDraftToStorage(toDraft(builder, savedDraftId || undefined));
    setSavedDraftId(saved.id); setSavedStatus(`Saved at ${new Date(saved.updatedAt).toLocaleTimeString()}`); setTimeout(() => setSavedStatus(''), 2000);
  };
  const loadDraft = (id: string) => { const d = getSavedResumeDrafts().find((x) => x.id === id); if (!d) return; setBuilder(fromDraft(d)); setSavedDraftId(d.id); };

  const exportDocx = () => {
    const lines = [`${builder.fullName}`, `${builder.title}`, `${builder.email} | ${builder.phone} | ${builder.location}`, '', 'SUMMARY', builder.summary, '', 'SKILLS', builder.skills, '', 'EXPERIENCE', builder.experience, '', 'PROJECTS', builder.projects, '', 'EDUCATION', builder.education, '', 'CERTIFICATIONS', builder.certifications, '', 'ACHIEVEMENTS', builder.achievements];
    const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial,sans-serif">${lines.join('\n').replace(/\n/g, '<br/>')}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${slugify(builder.fullName || 'resume')}.docx`; a.click(); URL.revokeObjectURL(url);
  };

  const tailorToJD = async () => {
    if (!builder.jd.trim()) { setSavedStatus('Paste JD first'); setTimeout(() => setSavedStatus(''), 1500); return; }
    setTailorLoading(true);
    try {
      const prompt = `Optimize this resume for ATS. Return ONLY JSON: {"summary":"...","skills":"comma,separated","experience":"line format role | company | duration | p1; p2","projects":"same line format"}. Resume=${JSON.stringify(builder)} JD=${builder.jd}`;
      const reply = await sendChatMessage([], prompt);
      const parsed = (() => { try { return JSON.parse(reply); } catch { const m = reply.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } })();
      if (parsed) setBuilder((p) => ({ ...p, summary: parsed.summary || p.summary, skills: parsed.skills || p.skills, experience: parsed.experience || p.experience, projects: parsed.projects || p.projects }));
      setSavedStatus('Tailored to JD');
    } catch {
      setSavedStatus('Tailoring failed');
    } finally {
      setTailorLoading(false); setTimeout(() => setSavedStatus(''), 2000);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => resolve((r.result as string).split(',')[1]); r.onerror = reject; });
      const result = await analyzeDocument(base64, file.type, jobDescription.trim() || undefined);
      setAnalysis(result); saveResumeScanToStorage(file.name, result, Boolean(jobDescription.trim()));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors self-start">Back to Dashboard</button>
      <div className="flex gap-2">
        <button onClick={() => setTab('analyzer')} className={`px-4 py-2 rounded ${tab === 'analyzer' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Resume Analyzer</button>
        <button onClick={() => setTab('builder')} className={`px-4 py-2 rounded ${tab === 'builder' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Resume Builder</button>
      </div>

      {tab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="resume-analyzer-panel bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-3">Upload Resume</h2>
            <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="on-dark-input w-full rounded px-3 py-2" accept="image/*,application/pdf" />
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="JD (optional)" className="on-dark-input w-full h-28 rounded px-3 py-2 mt-3" />
            <button onClick={handleAnalyze} disabled={!file || loading} className="w-full mt-3 bg-indigo-600 py-2 rounded text-white">{loading ? 'Analyzing...' : 'Analyze'}</button>
          </section>
          <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {!analysis && <p className="text-slate-400">Upload file to view insights.</p>}
            {!!analysis && <><h3 className="text-white font-semibold">Identified Skills</h3><p className="text-slate-300 text-sm mt-2">{analysis.skills_identified.join(', ')}</p><h3 className="text-white font-semibold mt-4">Missing Skills</h3><p className="text-slate-300 text-sm mt-2">{analysis.missing_skills.join(', ')}</p></>}
          </section>
        </div>
      )}

      {tab === 'builder' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="resume-builder-panel bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <h2 className="text-white text-xl font-bold">Resume Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">{(['fresher', 'experienced', 'fullstack'] as TemplateId[]).map((t) => <button key={t} onClick={() => setTemplate(t)} className={`p-2 rounded border text-sm ${builder.templateId === t ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-slate-700 text-slate-300'}`}>{t}</button>)}</div>

            {/* ATS Score Widget - Separate from Resume */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border border-emerald-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-emerald-100">ATS Compatibility Score</p>
                <p className={`text-xl font-bold ${ats >= 75 ? 'text-emerald-400' : ats >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{ats}%</p>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full transition-all ${ats >= 75 ? 'bg-emerald-400' : ats >= 55 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${ats}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><input value={builder.name} onChange={(e) => update('name', e.target.value)} placeholder="Draft Name" className="resume-field rounded px-3 py-2" /><input value={builder.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Full Name" className="resume-field rounded px-3 py-2" /><input value={builder.title} onChange={(e) => update('title', e.target.value)} placeholder="Title" className="resume-field rounded px-3 py-2" /><input value={builder.location} onChange={(e) => update('location', e.target.value)} placeholder="Location" className="resume-field rounded px-3 py-2" /><input value={builder.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="resume-field rounded px-3 py-2" /><input value={builder.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" className="resume-field rounded px-3 py-2" /></div>
            <textarea value={builder.links} onChange={(e) => update('links', e.target.value)} placeholder="Links: comma separated" className="resume-field w-full h-16 rounded px-3 py-2" />
            <textarea value={builder.summary} onChange={(e) => update('summary', e.target.value)} placeholder="Summary" className="resume-field w-full h-20 rounded px-3 py-2" />
            <textarea value={builder.skills} onChange={(e) => update('skills', e.target.value)} placeholder="Skills: comma separated" className="resume-field w-full h-16 rounded px-3 py-2" />
            <textarea value={builder.experience} onChange={(e) => update('experience', e.target.value)} placeholder="Experience (each line): Role | Company | Duration | point1; point2" className="resume-field w-full h-24 rounded px-3 py-2" />
            <textarea value={builder.projects} onChange={(e) => update('projects', e.target.value)} placeholder="Projects (each line): Name | Tech | Link | point1; point2" className="resume-field w-full h-24 rounded px-3 py-2" />
            <textarea value={builder.education} onChange={(e) => update('education', e.target.value)} placeholder="Education (each line): Degree | Institute | Year | Score" className="resume-field w-full h-20 rounded px-3 py-2" />
            <textarea value={builder.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="Certifications: comma separated" className="resume-field w-full h-14 rounded px-3 py-2" />
            <textarea value={builder.achievements} onChange={(e) => update('achievements', e.target.value)} placeholder="Achievements: comma separated" className="resume-field w-full h-14 rounded px-3 py-2" />
            <textarea value={builder.jd} onChange={(e) => update('jd', e.target.value)} placeholder="Job Description for ATS and AI tailoring" className="resume-field w-full h-24 rounded px-3 py-2" />
            <div className="flex flex-wrap gap-2"><button onClick={saveDraft} className="px-3 py-2 rounded bg-orange-600 text-white">Save Draft</button><button onClick={exportDocx} className="px-3 py-2 rounded bg-indigo-600 text-white">Download .docx</button><button onClick={tailorToJD} disabled={tailorLoading} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">{tailorLoading ? 'Tailoring...' : 'Tailor to JD'}</button>{savedDraftId && <button onClick={() => { deleteSavedResumeDraft(savedDraftId); setSavedDraftId(''); setSavedStatus('Draft deleted'); }} className="px-3 py-2 rounded bg-red-700 text-white">Delete</button>}</div>
            {savedStatus && <p className="text-xs text-cyan-300">{savedStatus}</p>}
            <div className="border border-slate-700 rounded p-2 bg-slate-800/40"><p className="text-sm text-white mb-1">Saved Drafts</p>{savedDrafts.slice(0, 6).map((d) => <button key={d.id} onClick={() => loadDraft(d.id)} className="w-full text-left text-xs text-slate-200 border border-slate-700 rounded p-2 mb-1">{d.name} - {new Date(d.updatedAt).toLocaleString()}</button>)}</div>
          </section>

          <section className="bg-white text-slate-900 rounded-xl p-8 border border-slate-200 shadow-lg">
            {/* Header Section */}
            <div className="border-b-2 border-slate-300 pb-4 mb-4">
              <h1 className="text-3xl font-bold text-slate-900">{builder.fullName || 'Your Name'}</h1>
              <p className="text-lg text-orange-600 font-semibold">{builder.title || 'Your Title'}</p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-700 mt-2">
                {builder.email && <span>📧 {builder.email}</span>}
                {builder.phone && <span>📱 {builder.phone}</span>}
                {builder.location && <span>📍 {builder.location}</span>}
              </div>
              {builder.links && (
                <div className="text-sm text-blue-600 mt-2 flex flex-wrap gap-2">
                  {splitCsv(builder.links).map((link, idx) => (
                    <a key={idx} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link} {idx < splitCsv(builder.links).length - 1 && '•'}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {builder.summary && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-2">Professional Summary</h3>
                <p className="text-sm leading-relaxed text-slate-800">{builder.summary}</p>
              </div>
            )}

            {/* Skills */}
            {builder.skills && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {splitCsv(builder.skills).map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-sm text-slate-800 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {builder.experience && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-3">Professional Experience</h3>
                {textToLines(builder.experience).map((line, idx) => {
                  const [role = '', company = '', duration = '', points = ''] = line.split('|').map((x) => x.trim());
                  const pointsList = points.split(';').map((x) => x.trim()).filter(Boolean);
                  return (
                    <div key={idx} className="mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-900">{role}</p>
                          <p className="text-sm text-slate-700">{company}</p>
                        </div>
                        {duration && <p className="text-xs text-slate-600 whitespace-nowrap ml-2">{duration}</p>}
                      </div>
                      {pointsList.length > 0 && (
                        <ul className="mt-1 ml-4 text-sm text-slate-800 list-disc">
                          {pointsList.map((point, pidx) => (
                            <li key={pidx} className="ml-2">{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Projects */}
            {builder.projects && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-3">Projects</h3>
                {textToLines(builder.projects).map((line, idx) => {
                  const [name = '', tech = '', link = '', points = ''] = line.split('|').map((x) => x.trim());
                  const pointsList = points.split(';').map((x) => x.trim()).filter(Boolean);
                  return (
                    <div key={idx} className="mb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{name}</p>
                          {tech && <p className="text-sm text-slate-700 italic">{tech}</p>}
                        </div>
                        {link && (
                          <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                            View →
                          </a>
                        )}
                      </div>
                      {pointsList.length > 0 && (
                        <ul className="mt-1 ml-4 text-sm text-slate-800 list-disc">
                          {pointsList.map((point, pidx) => (
                            <li key={pidx} className="ml-2">{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Education */}
            {builder.education && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-3">Education</h3>
                {textToLines(builder.education).map((line, idx) => {
                  const [degree = '', institute = '', year = '', score = ''] = line.split('|').map((x) => x.trim());
                  return (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-900">{degree}</p>
                          <p className="text-sm text-slate-700">{institute}</p>
                        </div>
                        <div className="text-right">
                          {year && <p className="text-xs text-slate-600">{year}</p>}
                          {score && <p className="text-xs text-slate-600 font-medium">{score}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Certifications */}
            {builder.certifications && splitCsv(builder.certifications).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-2">Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {splitCsv(builder.certifications).map((cert, idx) => (
                    <span key={idx} className="text-sm text-slate-800">
                      ✓ {cert} {idx < splitCsv(builder.certifications).length - 1 && '•'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {builder.achievements && splitCsv(builder.achievements).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 border-b-2 border-orange-500 pb-2 mb-2">Achievements</h3>
                <ul className="ml-4 text-sm text-slate-800 list-disc">
                  {splitCsv(builder.achievements).map((achievement, idx) => (
                    <li key={idx} className="ml-2">{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Checklist */}
            {missing.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500">
                <h4 className="text-sm font-bold text-amber-900 mb-2">💡 Improvement Suggestions</h4>
                <ul className="space-y-1">
                  {missing.map((x) => (
                    <li key={x} className="text-sm text-amber-800 flex items-start gap-2">
                      <span>•</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
