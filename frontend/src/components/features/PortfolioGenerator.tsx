import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { UserProfile } from '@shared/types';
import { sendChatMessage } from '../../services/geminiService';
import { getSavedResumeDrafts } from '../../services/storageService';

interface Props { user: UserProfile; onBack: () => void; }
type TemplateId =
  | 'studio'
  | 'minimal'
  | 'neo'
  | 'corporate'
  | 'gradient'
  | 'midnight'
  | 'paper'
  | 'ocean'
  | 'forest'
  | 'sunset';
type PProject = { id: string; title: string; description: string; tech: string; github: string; images: string[] };
type PExp = { id: string; role: string; company: string; duration: string; description: string };
type Data = {
  name: string; title: string; tagline: string; about: string; education: string; certifications: string; achievements: string;
  languages: string; frameworks: string; tools: string; databases: string;
  email: string; phone: string; linkedin: string; github: string; website: string; profileImage: string;
  projects: PProject[]; experience: PExp[];
};

const normalizeData = (raw: any): Data => {
  const safeProjects = Array.isArray(raw?.projects)
    ? raw.projects.map((p: any) => ({
        id: typeof p?.id === 'string' ? p.id : id(),
        title: typeof p?.title === 'string' ? p.title : '',
        description: typeof p?.description === 'string' ? p.description : '',
        tech: typeof p?.tech === 'string' ? p.tech : '',
        github: typeof p?.github === 'string' ? p.github : '',
        images: Array.isArray(p?.images) ? p.images.filter((x: any) => typeof x === 'string') : [],
      }))
    : [];

  const safeExperience = Array.isArray(raw?.experience)
    ? raw.experience.map((x: any) => ({
        id: typeof x?.id === 'string' ? x.id : id(),
        role: typeof x?.role === 'string' ? x.role : '',
        company: typeof x?.company === 'string' ? x.company : '',
        duration: typeof x?.duration === 'string' ? x.duration : '',
        description: typeof x?.description === 'string' ? x.description : '',
      }))
    : [];

  return {
    ...empty,
    ...raw,
    name: typeof raw?.name === 'string' ? raw.name : '',
    title: typeof raw?.title === 'string' ? raw.title : '',
    tagline: typeof raw?.tagline === 'string' ? raw.tagline : '',
    about: typeof raw?.about === 'string' ? raw.about : '',
    education: typeof raw?.education === 'string' ? raw.education : '',
    certifications: typeof raw?.certifications === 'string' ? raw.certifications : '',
    achievements: typeof raw?.achievements === 'string' ? raw.achievements : '',
    languages: typeof raw?.languages === 'string' ? raw.languages : '',
    frameworks: typeof raw?.frameworks === 'string' ? raw.frameworks : '',
    tools: typeof raw?.tools === 'string' ? raw.tools : '',
    databases: typeof raw?.databases === 'string' ? raw.databases : '',
    email: typeof raw?.email === 'string' ? raw.email : '',
    phone: typeof raw?.phone === 'string' ? raw.phone : '',
    linkedin: typeof raw?.linkedin === 'string' ? raw.linkedin : '',
    github: typeof raw?.github === 'string' ? raw.github : '',
    website: typeof raw?.website === 'string' ? raw.website : '',
    profileImage: typeof raw?.profileImage === 'string' ? raw.profileImage : '',
    projects: safeProjects,
    experience: safeExperience,
  };
};

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const empty: Data = { name:'', title:'', tagline:'', about:'', education:'', certifications:'', achievements:'', languages:'', frameworks:'', tools:'', databases:'', email:'', phone:'', linkedin:'', github:'', website:'', profileImage:'', projects:[], experience:[] };
const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const lis = (s: string) => (s || '').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean).map(x=>`<li>${esc(x.replace(/^[-*]\s*/,''))}</li>`).join('');
const ps = (s: string) => (s || '').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join('');
const okImage = (f: File) => ['image/jpeg','image/png','image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024;

const cssByTheme = (t: TemplateId) => `
*{box-sizing:border-box}body{margin:0;font-family:Segoe UI,Tahoma,sans-serif;${t==='neo'?'background:#0f172a;color:#e2e8f0':'background:#eef2ff;color:#0f172a'}}
main{max-width:1100px;margin:18px auto;background:${(t==='neo'||t==='midnight')?'#111827':'#fff'};border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(2,6,23,.16);animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:.2;transform:translateY(10px)}to{opacity:1;transform:none}}
.hero{display:flex;justify-content:space-between;gap:16px;padding:24px;border-bottom:1px solid ${(t==='neo'||t==='midnight')?'#334155':'#cbd5e1'};${t==='gradient'?'background:linear-gradient(110deg,#1e3a8a,#0ea5e9)':''}} .hero h1{margin:0;font-size:32px}.hero h2{margin:6px 0 0;color:${(t==='neo'||t==='midnight')?'#22d3ee':(t==='forest'?'#15803d':t==='sunset'?'#ea580c':'#2563eb')}}
.pic{width:110px;height:110px;border-radius:${t==='paper'?'4px':'14px'};object-fit:cover;border:2px solid ${(t==='neo'||t==='midnight')?'#334155':'#cbd5e1'}} .layout{display:grid;grid-template-columns:${t==='corporate'?'260px 1fr':'300px 1fr'}}
.left{padding:20px;border-right:1px solid ${(t==='neo'||t==='midnight')?'#334155':'#cbd5e1'};background:${t==='neo'?'#0b1220':t==='midnight'?'#020617':t==='paper'?'#fafaf9':t==='ocean'?'#eff6ff':t==='forest'?'#f0fdf4':'#f8fafc'}} .right{padding:20px}
.section{margin-bottom:16px}.section h3{margin:0 0 8px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;opacity:.8}
.card{border:1px solid ${(t==='neo'||t==='midnight')?'#334155':'#cbd5e1'};border-radius:${t==='minimal'?'6px':'12px'};padding:12px;margin-bottom:10px;${t==='corporate'?'box-shadow:0 4px 16px rgba(15,23,42,.08)':''}}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.gallery img{width:100%;height:78px;object-fit:cover;border-radius:${t==='paper'?'2px':'8px'}}
@media(max-width:900px){main{margin:0;border-radius:0}.layout{grid-template-columns:1fr}.left{border-right:0;border-bottom:1px solid ${t==='neo'?'#334155':'#cbd5e1'}}}
`;

const build = (d: Data, theme: TemplateId, inline: boolean) => {
  const css = cssByTheme(theme);
  const projects = d.projects.map(p => `<article class="card"><h4>${esc(p.title)}</h4><div>${esc(p.tech)} ${p.github ? `| <a href="${esc(p.github)}" target="_blank">GitHub</a>` : ''}</div>${ps(p.description)}${p.images.length?`<div class="gallery">${p.images.map(i=>`<img src="${i}" alt="img"/>`).join('')}</div>`:''}</article>`).join('');
  const exps = d.experience.map(x => `<div class="card"><strong>${esc(x.role)}</strong> - ${esc(x.company)}<br/><small>${esc(x.duration)}</small>${ps(x.description)}</div>`).join('');
  const profile = d.profileImage ? `<img class="pic" src="${d.profileImage}" alt="profile"/>` : `<div class="pic" style="display:flex;align-items:center;justify-content:center;background:#cbd5e1;color:#334155">No Image</div>`;
  const html = `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(d.name || 'Portfolio')}</title>${inline?`<style>${css}</style>`:`<link rel="stylesheet" href="style.css"/>`}</head><body><main><section class="hero"><div><h1>${esc(d.name || 'Student')}</h1><h2>${esc(d.title || 'Portfolio')}</h2>${ps(d.tagline)}</div>${profile}</section><section class="layout"><aside class="left"><section class="section"><h3>About</h3>${ps(d.about)}</section><section class="section"><h3>Education</h3>${ps(d.education)}</section><section class="section"><h3>Skills</h3><div><strong>Languages</strong><ul>${lis(d.languages)}</ul><strong>Frameworks</strong><ul>${lis(d.frameworks)}</ul><strong>Tools</strong><ul>${lis(d.tools)}</ul><strong>Databases</strong><ul>${lis(d.databases)}</ul></div></section><section class="section"><h3>Contact</h3><p>${esc(d.email)}</p><p>${esc(d.phone)}</p><p>${esc(d.linkedin)}</p><p>${esc(d.github)}</p><p>${esc(d.website)}</p></section></aside><section class="right"><section class="section"><h3>Projects</h3>${projects || '<p>Add projects</p>'}</section><section class="section"><h3>Experience</h3>${exps || '<p>Add experience</p>'}</section><section class="section"><h3>Achievements</h3><ul>${lis(d.achievements)}</ul></section><section class="section"><h3>Certifications</h3><ul>${lis(d.certifications)}</ul></section></section></section></main></body></html>`;
  return { html, css };
};

const parseJson = (raw: string) => {
  const clean = (raw || '').replace(/^```json\s*/i,'').replace(/^```/i,'').replace(/```$/,'').trim();
  const i = clean.indexOf('{'); const j = clean.lastIndexOf('}');
  if (i < 0 || j < i) return null;
  try { return JSON.parse(clean.slice(i, j + 1)); } catch { return null; }
};

const PortfolioGenerator: React.FC<Props> = ({ user, onBack }) => {
  const key = `KBV_portfolio_studio_${user.email}`;
  const [data, setData] = useState<Data>(empty);
  const [theme, setTheme] = useState<TemplateId>('studio');
  const [prompt, setPrompt] = useState('');
  const [msgs, setMsgs] = useState<Array<{id:string; role:'user'|'assistant'; text:string}>>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [repoName, setRepoName] = useState(`${(user.name || 'student').toLowerCase().replace(/\s+/g, '-')}-portfolio`);
  const [aiMode, setAiMode] = useState<'Copilot' | 'Agent'>('Copilot');
  const [targetSection, setTargetSection] = useState<'all' | 'about' | 'projects' | 'experience' | 'skills' | 'contact'>('all');
  const [lastDiff, setLastDiff] = useState<Array<{ field: string; before: string; after: string }>>([]);

  const persist = (n: Data) => {
    const normalized = normalizeData(n);
    setData(normalized);
    localStorage.setItem(key, JSON.stringify(normalized));
  };
  const addMsg = (role: 'user'|'assistant', text: string) => setMsgs(s => [...s, { id: id(), role, text }]);
  const streamAssistant = async (text: string) => {
    const finalText = (text || '').trim() || 'Updated portfolio.';
    const msgId = id();
    setMsgs((s) => [...s, { id: msgId, role: 'assistant', text: '' }]);
    const words = finalText.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // simulate streaming tokens in UI
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 22));
      setMsgs((s) => s.map((m) => (m.id === msgId ? { ...m, text: `${m.text}${i ? ' ' : ''}${words[i]}` } : m)));
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) { try { setData(normalizeData(JSON.parse(raw))); return; } catch { /* ignore */ } }
    const draft = getSavedResumeDrafts()[0];
    persist({
      ...empty,
      name: draft?.fullName || user.name,
      title: draft?.title || user.targetRole || 'Software Engineer',
      tagline: 'Building reliable products and improving every day.',
      about: draft?.summary || 'Motivated developer focused on practical impact.',
      education: draft?.education?.map((e: any) => `${e.degree} - ${e.institute} (${e.year})`).join('\n') || '',
      achievements: (draft?.achievements || []).join('\n'),
      certifications: (draft?.certifications || []).join('\n'),
      languages: (draft?.skills || []).slice(0,5).join(', '),
      frameworks: (draft?.skills || []).slice(5,10).join(', '),
      tools: 'Git, Docker, VS Code',
      databases: 'MySQL, PostgreSQL',
      email: draft?.email || user.email,
      phone: draft?.phone || '',
      linkedin: draft?.links?.find((l: string)=>/linkedin/i.test(l)) || '',
      github: draft?.links?.find((l: string)=>/github/i.test(l)) || '',
      website: draft?.links?.find((l: string)=>/portfolio|vercel|netlify/i.test(l)) || '',
      projects: draft?.projects?.map((p: any) => ({ id: id(), title: p.name || 'Project', description: (p.points || []).join(' '), tech: p.tech || '', github: p.link || '', images: [] })) || [],
      experience: draft?.experience?.map((x: any) => ({ id: id(), role: x.role || 'Role', company: x.company || 'Company', duration: x.duration || '', description: (x.points || []).join(' ') })) || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const built = useMemo(() => build(data, theme, false), [data, theme]);
  const preview = useMemo(() => build(data, theme, true).html, [data, theme]);
  const completion = useMemo(() => {
    const fields = [data.name, data.title, data.about, data.education, data.languages, data.frameworks, data.tools, data.databases, data.email, String(data.projects.length), String(data.experience.length)];
    return Math.round((fields.filter(x => String(x || '').trim() !== '' && x !== '0').length / fields.length) * 100);
  }, [data]);

  const runAi = async (manual?: string) => {
    const q = (manual ?? prompt).trim(); if (!q || loading) return;
    addMsg('user', q); setPrompt(''); setLoading(true); setStatus('AI generating...');
    const historyContext = msgs.slice(-8).map((m) => `${m.role}: ${m.text}`).join('\n');
    const instr = `You are an advanced portfolio ${aiMode} assistant.
Target section: ${targetSection}.
Return STRICT JSON only:
{"assistant_reply":"...","updates":{"name":"","title":"","tagline":"","about":"","education":"","certifications":"","achievements":"","languages":"","frameworks":"","tools":"","databases":"","email":"","phone":"","linkedin":"","github":"","website":"","projects":[{"id":"","title":"","description":"","tech":"","github":"","images":[]}],"experience":[{"id":"","role":"","company":"","duration":"","description":""}]}}
Rules:
- Keep plain text only.
- No markdown bullets or asterisks.
- If target section is not all, prefer updates in that section only.
- Keep unchanged fields omitted.
Conversation context:
${historyContext}
Current data:
${JSON.stringify(data)}
User request:
${q}`;
    try {
      const rep = await sendChatMessage([], instr);
      const parsed: any = parseJson(rep);
      if (parsed?.updates) {
        const u = parsed.updates;
        const next: Data = {
          ...data, ...u,
          projects: Array.isArray(u.projects) ? u.projects.map((p: any) => ({ id: p.id || id(), title: p.title || '', description: p.description || '', tech: p.tech || '', github: p.github || '', images: Array.isArray(p.images) ? p.images : [] })) : data.projects,
          experience: Array.isArray(u.experience) ? u.experience.map((x: any) => ({ id: x.id || id(), role: x.role || '', company: x.company || '', duration: x.duration || '', description: x.description || '' })) : data.experience,
        };
        const normalizedNext = normalizeData(next);
        const diffFields = ['name','title','tagline','about','education','certifications','achievements','languages','frameworks','tools','databases','email','phone','linkedin','github','website']
          .map((k) => ({
            field: k,
            before: String((data as any)[k] || ''),
            after: String((normalizedNext as any)[k] || ''),
          }))
          .filter((x) => x.before !== x.after)
          .slice(0, 6);
        setLastDiff(diffFields);
        persist(normalizedNext);
        await streamAssistant(parsed.assistant_reply || 'Updated portfolio.');
      } else await streamAssistant('Could not parse AI response.');
    } catch (e: any) { addMsg('assistant', e?.message || 'AI request failed.'); }
    finally { setLoading(false); setStatus(''); }
  };

  const runAutoBuild = async () => {
    if (loading) return;
    setStatus('Running AI auto-build pipeline...');
    const steps = [
      'Create a strong hero tagline and about section for top product-company hiring.',
      'Generate 3 high-impact project descriptions with measurable outcomes.',
      'Generate achievements, certifications, and skill summaries for ATS screening.',
    ];
    for (const step of steps) {
      // sequential execution for deterministic portfolio upgrades
      // eslint-disable-next-line no-await-in-loop
      await runAi(step);
    }
    setStatus('Auto-build completed.');
    setTimeout(() => setStatus(''), 1800);
  };

  const onProfileUpload = (f?: File | null) => {
    if (!f) return; if (!okImage(f)) { setStatus('Only JPG/PNG/WEBP <= 5MB.'); return; }
    const r = new FileReader(); r.onload = () => persist({ ...data, profileImage: String(r.result || '') }); r.readAsDataURL(f);
  };
  const onProjectImages = (pid: string, files: FileList | null) => {
    const arr = Array.from(files || []).filter(okImage); if (!arr.length) { setStatus('No valid images.'); return; }
    Promise.all(arr.map(f => new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.readAsDataURL(f); }))).then(imgs => persist({ ...data, projects: data.projects.map(p => p.id === pid ? { ...p, images: [...p.images, ...imgs].slice(0, 6) } : p) }));
  };
  const updateProject = (pid: string, key: keyof PProject, value: string) => {
    persist({ ...data, projects: data.projects.map((p) => (p.id === pid ? { ...p, [key]: value } : p)) });
  };
  const removeProject = (pid: string) => {
    persist({ ...data, projects: data.projects.filter((p) => p.id !== pid) });
  };
  const updateExperience = (eid: string, key: keyof PExp, value: string) => {
    persist({ ...data, experience: data.experience.map((x) => (x.id === eid ? { ...x, [key]: value } : x)) });
  };
  const removeExperience = (eid: string) => {
    persist({ ...data, experience: data.experience.filter((x) => x.id !== eid) });
  };

  const saveTxt = (name: string, content: string, type = 'text/plain;charset=utf-8') => { const b = new Blob([content], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); };
  const singleHtml = () => saveTxt(`${repoName || 'portfolio'}.html`, build(data, theme, true).html, 'text/html;charset=utf-8');
  const toZipImage = (zip: JSZip, path: string, url: string) => { const m = url.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/i); if (!m) return false; zip.file(path, m[3], { base64: true }); return true; };
  const zipAll = async () => {
    const z = new JSZip(); const exp: Data = JSON.parse(JSON.stringify(data));
    if (exp.profileImage) { const ex = exp.profileImage.includes('png') ? 'png' : exp.profileImage.includes('webp') ? 'webp' : 'jpg'; const p = `images/profile.${ex}`; if (toZipImage(z, p, exp.profileImage)) exp.profileImage = p; }
    exp.projects = exp.projects.map((p, i) => ({ ...p, images: p.images.map((img, j) => { const ex = img.includes('png') ? 'png' : img.includes('webp') ? 'webp' : 'jpg'; const ph = `images/project-${i + 1}-${j + 1}.${ex}`; return toZipImage(z, ph, img) ? ph : img; }) }));
    const b = build(exp, theme, false); z.file('index.html', b.html); z.file('style.css', b.css); z.file('portfolio-data.json', JSON.stringify(exp, null, 2)); z.file('README.md', '# Portfolio\nGenerated by AI Portfolio Studio.');
    const blob = await z.generateAsync({ type: 'blob' }); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = `${repoName || 'portfolio-project'}.zip`; a.click(); URL.revokeObjectURL(u);
  };
  const copyCmd = async () => { await navigator.clipboard.writeText(`git init\ngit add .\ngit commit -m \"portfolio\"\ngit remote add origin https://github.com/<username>/${repoName}.git\ngit branch -M main\ngit push -u origin main\nvercel deploy`); setStatus('Publish commands copied.'); setTimeout(()=>setStatus(''),1600); };

  return (
    <div className="space-y-4 premium-page feature-portfolio">
      <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-2xl font-bold text-blue-500">AI Portfolio Studio</h2><p className="text-sm text-slate-300">Left chat + editor, right live preview with animations and templates.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={theme} onChange={(e)=>setTheme(e.target.value as TemplateId)} className="px-3 py-2 rounded border border-slate-600 bg-slate-900/70 text-slate-100 text-sm">
              <option value="studio">Studio</option>
              <option value="minimal">Minimal</option>
              <option value="neo">Neo</option>
              <option value="corporate">Corporate</option>
              <option value="gradient">Gradient</option>
              <option value="midnight">Midnight</option>
              <option value="paper">Paper</option>
              <option value="ocean">Ocean</option>
              <option value="forest">Forest</option>
              <option value="sunset">Sunset</option>
            </select>
            <select value={aiMode} onChange={(e)=>setAiMode(e.target.value as 'Copilot' | 'Agent')} className="px-3 py-2 rounded border border-slate-600 bg-slate-900/70 text-slate-100 text-sm"><option value="Copilot">AI Copilot</option><option value="Agent">AI Agent</option></select>
            <select value={targetSection} onChange={(e)=>setTargetSection(e.target.value as any)} className="px-3 py-2 rounded border border-slate-600 bg-slate-900/70 text-slate-100 text-sm"><option value="all">All Sections</option><option value="about">About</option><option value="projects">Projects</option><option value="experience">Experience</option><option value="skills">Skills</option><option value="contact">Contact</option></select>
            <button onClick={()=>runAi('Improve entire portfolio for product company hiring')} className="px-3 py-2 rounded border border-slate-600 text-slate-100 hover:bg-slate-700/40 text-sm">AI Improve</button>
            <button onClick={runAutoBuild} className="px-3 py-2 rounded border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10 text-sm">Auto Build</button>
            <button onClick={zipAll} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">Download ZIP</button>
            <button onClick={singleHtml} className="px-3 py-2 rounded border border-slate-600 text-slate-100 hover:bg-slate-700/40 text-sm">Single HTML</button>
            <button onClick={copyCmd} className="px-3 py-2 rounded border border-slate-600 text-slate-100 hover:bg-slate-700/40 text-sm">Publish Cmd</button>
            <button onClick={onBack} className="px-3 py-2 rounded border border-slate-600 text-slate-100 hover:bg-slate-700/40 text-sm">Back</button>
          </div>
        </div>
        <div className="mt-3 h-2 rounded bg-slate-800 overflow-hidden"><div className="h-2 bg-blue-500" style={{ width: `${completion}%` }} /></div>
        <p className="mt-1 text-xs text-slate-400">Completion: {completion}% {status ? `| ${status}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[74vh]">
        <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={data.name} onChange={(e)=>persist({ ...data, name: e.target.value })} placeholder="Name" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <input value={data.title} onChange={(e)=>persist({ ...data, title: e.target.value })} placeholder="Title" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <input value={data.email} onChange={(e)=>persist({ ...data, email: e.target.value })} placeholder="Email" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <input value={data.phone} onChange={(e)=>persist({ ...data, phone: e.target.value })} placeholder="Phone" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <input value={data.linkedin} onChange={(e)=>persist({ ...data, linkedin: e.target.value })} placeholder="LinkedIn URL" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <input value={data.github} onChange={(e)=>persist({ ...data, github: e.target.value })} placeholder="GitHub URL" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          </div>
          <input value={data.tagline} onChange={(e)=>persist({ ...data, tagline: e.target.value })} placeholder="Tagline" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          <textarea value={data.about} onChange={(e)=>persist({ ...data, about: e.target.value })} placeholder="About" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          <textarea value={data.education} onChange={(e)=>persist({ ...data, education: e.target.value })} placeholder="Education" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          <div className="grid grid-cols-2 gap-2">
            <textarea value={data.languages} onChange={(e)=>persist({ ...data, languages: e.target.value })} placeholder="Languages" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <textarea value={data.frameworks} onChange={(e)=>persist({ ...data, frameworks: e.target.value })} placeholder="Frameworks" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea value={data.tools} onChange={(e)=>persist({ ...data, tools: e.target.value })} placeholder="Tools" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
            <textarea value={data.databases} onChange={(e)=>persist({ ...data, databases: e.target.value })} placeholder="Databases" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          </div>
          <textarea value={data.achievements} onChange={(e)=>persist({ ...data, achievements: e.target.value })} placeholder="Achievements" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          <textarea value={data.certifications} onChange={(e)=>persist({ ...data, certifications: e.target.value })} placeholder="Certifications" rows={2} className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" />
          <div className="flex items-center gap-2">
            <label className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 cursor-pointer">Upload Profile Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>onProfileUpload(e.target.files?.[0])} /></label>
            <button onClick={()=>persist({ ...data, projects: [...data.projects, { id: id(), title: '', description: '', tech: '', github: '', images: [] }] })} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300">Add Project</button>
            <button onClick={()=>persist({ ...data, experience: [...data.experience, { id: id(), role: '', company: '', duration: '', description: '' }] })} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300">Add Experience</button>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-2">{data.projects.map(p => <div key={p.id} className="rounded border border-slate-700 p-2"><input value={p.title} onChange={(e)=>updateProject(p.id,'title',e.target.value)} placeholder="Project title" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><input value={p.tech} onChange={(e)=>updateProject(p.id,'tech',e.target.value)} placeholder="Tech" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><textarea value={p.description} onChange={(e)=>updateProject(p.id,'description',e.target.value)} rows={2} placeholder="Description" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><label className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 cursor-pointer">Images<input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>onProjectImages(p.id,e.target.files)} /></label><button onClick={()=>removeProject(p.id)} className="ml-2 text-xs px-2 py-1 rounded border border-rose-500 text-rose-300">Remove</button></div>)}</div>
          <div className="max-h-28 overflow-y-auto space-y-2">{data.experience.map(x => <div key={x.id} className="rounded border border-slate-700 p-2"><input value={x.role} onChange={(e)=>updateExperience(x.id,'role',e.target.value)} placeholder="Role" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><input value={x.company} onChange={(e)=>updateExperience(x.id,'company',e.target.value)} placeholder="Company" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><input value={x.duration} onChange={(e)=>updateExperience(x.id,'duration',e.target.value)} placeholder="Duration" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><textarea value={x.description} onChange={(e)=>updateExperience(x.id,'description',e.target.value)} rows={2} placeholder="Description" className="w-full bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm mb-1" /><button onClick={()=>removeExperience(x.id)} className="text-xs px-2 py-1 rounded border border-rose-500 text-rose-300">Remove</button></div>)}</div>
          {lastDiff.length > 0 && (
            <div className="rounded border border-cyan-700/60 bg-cyan-900/10 p-2">
              <p className="text-xs font-semibold text-cyan-300 mb-1">Last AI Changes</p>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {lastDiff.map((d) => (
                    <p key={d.field} className="text-[11px] text-slate-200">
                      <span className="text-cyan-300">{d.field}:</span> "{d.before.slice(0, 40)}" {'->'} "{d.after.slice(0, 40)}"
                    </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-2">{msgs.map(m => <div key={m.id} className={`rounded-lg p-2 text-xs ${m.role==='user'?'bg-blue-600/20 border border-blue-500/30 text-blue-100':'bg-slate-800/80 border border-slate-700 text-slate-200'}`}>{m.text}</div>)}</div>
          <div className="flex gap-2"><input value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Prompt AI..." className="flex-1 bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();runAi();}}} /><button onClick={()=>runAi()} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{loading?'Working...':'Send'}</button></div>
          <div className="flex flex-wrap gap-2">{['Create a Java developer portfolio with 3 projects','Rewrite my about section','Improve project descriptions with impact','Add achievements and certifications'].map(t => <button key={t} onClick={()=>runAi(t)} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300">{t}</button>)}</div>
          <div className="grid grid-cols-2 gap-2"><input value={repoName} onChange={(e)=>setRepoName(e.target.value)} placeholder="Repo name" className="bg-slate-900/70 border border-slate-600 rounded px-3 py-2 text-slate-100" /><div className="flex gap-2"><button onClick={()=>window.open('https://github.com/new','_blank','noopener')} className="flex-1 px-2 py-2 rounded border border-slate-600 text-slate-100 text-xs">GitHub</button><button onClick={()=>window.open('https://vercel.com/new','_blank','noopener')} className="flex-1 px-2 py-2 rounded border border-slate-600 text-slate-100 text-xs">Vercel</button></div></div>
        </div>

        <div className="glass-panel rounded-xl border border-slate-700 premium-card overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between"><p className="text-sm text-slate-200">Live Portfolio Preview</p><p className="text-xs text-slate-400">Hero / About / Skills / Projects / Experience / Contact</p></div>
          <iframe title="portfolio-preview" srcDoc={preview} className="w-full h-[78vh] bg-white" />
        </div>
      </div>

      <div className="hidden" aria-hidden="true">{built.html.length + built.css.length}</div>
    </div>
  );
};

export default PortfolioGenerator;
