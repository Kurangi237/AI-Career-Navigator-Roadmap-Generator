import React, { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeDocument, sendChatMessage } from '../../services/geminiService';
import { SkillAnalysisResponse } from '@shared/types';
import { deleteSavedResumeDraft, getSavedResumeDrafts, saveResumeDraftToStorage, saveResumeScanToStorage, type ResumeDraft } from '../../services/storageService';

interface Props {
  onBack: () => void;
  initialJobDescription?: string;
  onConsumeInitialJobDescription?: () => void;
}
type ResumeTab = 'analyzer' | 'builder';
type TemplateId = 'fresher' | 'experienced' | 'fullstack' | 'backend' | 'data_analyst' | 'devops';
type ResumeFont = 'Calibri' | 'Arial' | 'Georgia' | 'Times New Roman' | 'Verdana';
type ResumeStyle =
  | 'serif_classic'
  | 'grey_bands'
  | 'blue_executive'
  | 'compact_monoline'
  | 'timeline_left_rail'
  | 'teal_sidebar'
  | 'teal_sidebar_alt';
type ResumeLayout =
  | 'single_column'
  | 'two_column_sidebar'
  | 'split_header'
  | 'skills_left_rail'
  | 'experience_first'
  | 'projects_first'
  | 'compact_blocks'
  | 'timeline'
  | 'hybrid_grid'
  | 'profile_frame'
  | 'banded_profile';

type BuilderState = {
  name: string; templateId: TemplateId; fullName: string; title: string; email: string; phone: string; location: string;
  links: string; summary: string; skills: string; experience: string; projects: string; education: string; certifications: string; achievements: string; jd: string; photoUrl: string;
};

const templates: Record<TemplateId, BuilderState> = {
  fresher: { name: 'Fresher Resume', templateId: 'fresher', fullName: 'Your Name', title: 'Software Engineer Intern', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'Motivated computer science student with strong DSA fundamentals and full stack project experience.', skills: 'C++, JavaScript, React, Node.js, SQL, Git', experience: 'Intern | ABC Tech | Jan 2025 - Mar 2025 | Built APIs; Improved response by 20%', projects: 'MNC DSA Prep Hub | React, Node.js | github.com/yourname/mnc-dsa-prep | Built DSA problem platform; Implemented judge system', education: 'B.Tech CSE | University Name | 2025 | 8.7 CGPA', certifications: 'Meta Front-End Developer', achievements: 'Solved 300+ DSA problems from top MNC interview patterns', jd: '', photoUrl: '' },
  experienced: { name: 'Experienced Resume', templateId: 'experienced', fullName: 'Your Name', title: 'Software Engineer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'Backend-focused engineer with production experience in scalable systems and performance optimization.', skills: 'Java, Spring Boot, PostgreSQL, Redis, Docker, AWS', experience: 'Software Engineer | Tech Company | Jan 2023 - Present | Built APIs serving 1M+ requests; Reduced latency by 35%', projects: 'Internal Analytics Tool | React, Java, PostgreSQL | | Built dashboard; Added role-based analytics', education: 'B.Tech CSE | University Name | 2022 | 8.5 CGPA', certifications: 'AWS Cloud Practitioner', achievements: 'Top 10% coding contests', jd: '', photoUrl: '' },
  fullstack: { name: 'Full Stack Resume', templateId: 'fullstack', fullName: 'Your Name', title: 'Full Stack Developer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname, portfolio.com', summary: 'Full stack developer building end-to-end products with strong frontend UX and backend reliability.', skills: 'React, TypeScript, Node.js, Express, MongoDB, PostgreSQL, Docker', experience: '', projects: 'Placement Tracker | React, Node.js, PostgreSQL | github.com/yourname/placement-tracker | Built dashboard; Added progress analytics', education: 'B.E IT | University Name | 2024 | 8.2 CGPA', certifications: '', achievements: '', jd: '', photoUrl: '' },
  backend: { name: 'Backend Engineer Resume', templateId: 'backend', fullName: 'Your Name', title: 'Backend Engineer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'Backend engineer focused on scalable API design, distributed systems, and data-intensive services.', skills: 'Java, Spring Boot, Node.js, PostgreSQL, Redis, Kafka, Docker, AWS', experience: 'Backend Engineer | XYZ Tech | Jan 2023 - Present | Built microservices; Reduced API p95 latency by 30%', projects: 'Order Processing Engine | Java, Kafka, PostgreSQL | github.com/yourname/order-engine | Designed event-driven workflow; Added retry + DLQ', education: 'B.Tech CSE | University Name | 2023 | 8.4 CGPA', certifications: 'AWS Developer Associate', achievements: 'Improved API reliability to 99.95%', jd: '', photoUrl: '' },
  data_analyst: { name: 'Data Analyst Resume', templateId: 'data_analyst', fullName: 'Your Name', title: 'Data Analyst', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname, tableau.com/profile/yourname', summary: 'Data analyst with strong SQL, dashboarding, and experimentation skills to drive product decisions.', skills: 'SQL, Python, Excel, Tableau, Power BI, Statistics, A/B Testing', experience: 'Data Analyst Intern | ABC Analytics | Jun 2024 - Dec 2024 | Built KPI dashboards; Automated reporting pipeline', projects: 'Sales Insights Dashboard | SQL, Tableau, Python | github.com/yourname/sales-insights | Increased report adoption by 40%', education: 'B.Sc Data Science | University Name | 2024 | 8.8 CGPA', certifications: 'Google Data Analytics', achievements: 'Won college analytics hackathon', jd: '', photoUrl: '' },
  devops: { name: 'DevOps Engineer Resume', templateId: 'devops', fullName: 'Your Name', title: 'DevOps Engineer', email: 'you@example.com', phone: '+1 000 000 0000', location: 'City, Country', links: 'linkedin.com/in/yourname, github.com/yourname', summary: 'DevOps engineer experienced in CI/CD, infrastructure as code, monitoring, and cloud automation.', skills: 'Linux, Docker, Kubernetes, Terraform, Jenkins, GitHub Actions, AWS, Prometheus, Grafana', experience: 'DevOps Engineer | CloudOps Inc | Jan 2023 - Present | Automated deployments; Reduced release time by 50%', projects: 'K8s Observability Stack | Kubernetes, Prometheus, Grafana | github.com/yourname/k8s-observability | Built production monitoring and alerting', education: 'B.Tech IT | University Name | 2022 | 8.1 CGPA', certifications: 'AWS SysOps Administrator', achievements: 'Maintained 99.9% uptime across services', jd: '', photoUrl: '' },
};

const splitCsv = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const textToLines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const cleanAiPlainText = (input: string) =>
  input
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```$/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
const ATS_STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'you', 'your', 'from', 'that', 'this', 'are', 'our', 'job', 'role', 'must', 'will', 'have', 'has', 'into', 'across', 'using', 'used', 'not', 'all', 'any', 'or']);
const extractTerms = (input: string, max = 40) =>
  Array.from(new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((x) => x.length > 2 && !ATS_STOP_WORDS.has(x))
  )).slice(0, max);

const RESUME_STYLES: Array<{ id: ResumeStyle; label: string; description: string; primary: string; bg: string; chipBg: string; chipBorder: string; layout: ResumeLayout; supportsPhoto: boolean }> = [
  { id: 'serif_classic', label: 'Serif Classic', description: 'Minimal serif style with section dividers', primary: '#222222', bg: '#ffffff', chipBg: '#f8f8f8', chipBorder: '#dddddd', layout: 'split_header', supportsPhoto: false },
  { id: 'grey_bands', label: 'Grey Bands', description: 'Centered title and grey section bands', primary: '#303030', bg: '#ffffff', chipBg: '#f3f4f6', chipBorder: '#d1d5db', layout: 'banded_profile', supportsPhoto: false },
  { id: 'blue_executive', label: 'Blue Executive', description: 'Blue headings with right-side profile image', primary: '#1d4ed8', bg: '#ffffff', chipBg: '#eff6ff', chipBorder: '#bfdbfe', layout: 'split_header', supportsPhoto: true },
  { id: 'compact_monoline', label: 'Compact Monoline', description: 'Simple single-column compact professional format', primary: '#111827', bg: '#ffffff', chipBg: '#f8fafc', chipBorder: '#e5e7eb', layout: 'single_column', supportsPhoto: true },
  { id: 'timeline_left_rail', label: 'Timeline Left Rail', description: 'Left info rail + right timeline content', primary: '#111111', bg: '#ffffff', chipBg: '#f5f5f5', chipBorder: '#d4d4d4', layout: 'profile_frame', supportsPhoto: true },
  { id: 'teal_sidebar', label: 'Teal Sidebar', description: 'Teal header with left skill sidebar', primary: '#0f766e', bg: '#ffffff', chipBg: '#ecfeff', chipBorder: '#99f6e4', layout: 'skills_left_rail', supportsPhoto: true },
  { id: 'teal_sidebar_alt', label: 'Teal Sidebar Alt', description: 'Alternate teal resume variation', primary: '#059669', bg: '#ffffff', chipBg: '#ecfdf5', chipBorder: '#86efac', layout: 'skills_left_rail', supportsPhoto: true },
];
const ATS_MODELS: Array<{ name: string; url: string; weight: number; offset: number; note: string }> = [
  { name: 'Jobscan Model', url: 'https://www.jobscan.co/', weight: 1.0, offset: 0, note: 'Keyword and parser alignment model' },
  { name: 'ResumeWorded Model', url: 'https://resumeworded.com/', weight: 0.95, offset: 2, note: 'Keyword density and section hygiene' },
  { name: 'Kickresume Model', url: 'https://www.kickresume.com/', weight: 0.9, offset: 3, note: 'Design + ATS readability checks' },
  { name: 'Mployee.me Model', url: 'https://mployee.me/', weight: 1.05, offset: -2, note: 'Multi-ATS MNC style benchmark' },
  { name: 'ResumeGyani Model', url: 'https://resumegyani.in/', weight: 0.92, offset: 1, note: 'India MNC parser simulation style' },
];

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
  certifications: d.certifications.join(', '), achievements: d.achievements.join(', '), jd: '', photoUrl: '',
});

const ResumeAnalyzer: React.FC<Props> = ({ onBack, initialJobDescription, onConsumeInitialJobDescription }) => {
  const [tab, setTab] = useState<ResumeTab>('analyzer');
  const [builder, setBuilder] = useState<BuilderState>(templates.fresher);
  const [resumeFont, setResumeFont] = useState<ResumeFont>('Calibri');
  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>('serif_classic');
  const [savedDraftId, setSavedDraftId] = useState('');
  const [savedStatus, setSavedStatus] = useState('');
  const [tailorLoading, setTailorLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewToolbar, setPreviewToolbar] = useState({ visible: false, x: 16, y: 16, text: '', bold: false, fontSize: 12, align: 'left' as 'left' | 'center' | 'right' });
  const [previewAiLoading, setPreviewAiLoading] = useState(false);
  const [fieldFilter, setFieldFilter] = useState('');
  const [photoFrameSize, setPhotoFrameSize] = useState(76);
  const savedDrafts = useMemo(() => getSavedResumeDrafts(), [savedStatus]);

  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysisResponse | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const resumeIframeRef = useRef<HTMLIFrameElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialJobDescription?.trim()) return;
    setJobDescription(initialJobDescription);
    setBuilder((prev) => ({ ...prev, jd: initialJobDescription }));
    setTab('builder');
    onConsumeInitialJobDescription && onConsumeInitialJobDescription();
  }, [initialJobDescription, onConsumeInitialJobDescription]);

  useEffect(() => {
    setPreviewHtml(buildResumeDocumentHtml(true));
  }, [builder, resumeFont, resumeStyle, photoFrameSize]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload) return;
      if (payload.type === 'resume-photo-click') {
        photoFileInputRef.current?.click();
        return;
      }
      if (payload.type !== 'resume-selection') return;
      const text = String(payload.text || '').trim();
      if (!text) {
        setPreviewToolbar((prev) => ({ ...prev, visible: false }));
        return;
      }
      const hostRect = resumePreviewRef.current?.getBoundingClientRect();
      const rawX = Number(payload.x) || 16;
      const rawY = Number(payload.y) || 16;
      const relX = hostRect ? rawX - hostRect.left : rawX;
      const relY = hostRect ? rawY - hostRect.top : rawY;
      setPreviewToolbar({
        visible: true,
        x: Math.max(10, relX),
        y: Math.max(10, relY),
        text,
        bold: Boolean(payload.bold),
        fontSize: Number(payload.fontSize) || 12,
        align: (payload.align === 'center' || payload.align === 'right') ? payload.align : 'left',
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

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

  const jdTerms = useMemo(() => extractTerms(builder.jd, 40), [builder.jd]);
  const resumeText = useMemo(() => JSON.stringify({ ...builder, jd: '' }).toLowerCase(), [builder]);
  const matchedTerms = useMemo(() => jdTerms.filter((term) => resumeText.includes(term)), [jdTerms, resumeText]);

  const ats = useMemo(() => {
    const sectionScore = clamp(100 - missing.length * 12);
    const keywordScore = jdTerms.length ? Math.round((matchedTerms.length / jdTerms.length) * 100) : 78;
    const metricsCount = `${builder.experience}\n${builder.projects}`.match(/\b\d+%?|\$\d+|\d+x\b/g)?.length || 0;
    const longLinePenalty = textToLines(`${builder.summary}\n${builder.experience}\n${builder.projects}`).filter((line) => line.length > 180).length * 4;
    const formatScore = clamp(65 + Math.min(metricsCount * 6, 30) - longLinePenalty);
    return clamp(Math.round(sectionScore * 0.35 + keywordScore * 0.45 + formatScore * 0.2));
  }, [builder.experience, builder.projects, builder.summary, jdTerms.length, matchedTerms.length, missing]);

  const atsInsights = useMemo(() => {
    const missingTerms = jdTerms.filter((term) => !resumeText.includes(term)).slice(0, 10);
    const matchRate = jdTerms.length ? Math.round((matchedTerms.length / jdTerms.length) * 100) : 0;
    const modelScores = ATS_MODELS.map((m) => ({
      ...m,
      score: clamp(Math.round(ats * m.weight + m.offset)),
    }));
    const checks = [
      { label: 'Job Description added', ok: builder.jd.trim().length >= 80, fix: 'Paste the full target job description (80+ chars).' },
      { label: 'Summary length', ok: builder.summary.trim().length >= 80, fix: 'Keep summary around 80-180 characters with role keywords.' },
      { label: 'Skills count', ok: splitCsv(builder.skills).length >= 8, fix: 'Add 8+ role-specific hard skills.' },
      { label: 'Impact metrics', ok: /(\d+%|\$\d+|\d+x)/.test(`${builder.experience} ${builder.projects}`), fix: 'Add measurable metrics like 30% latency reduction.' },
    ];
    return { jdTermsCount: jdTerms.length, matchedCount: matchedTerms.length, matchRate, missingTerms, modelScores, checks };
  }, [ats, builder.jd, builder.projects, builder.skills, builder.summary, jdTerms, matchedTerms.length, resumeText]);

  const update = (k: keyof BuilderState, v: string) => setBuilder((p) => ({ ...p, [k]: v }));
  const setTemplate = (t: TemplateId) => { setBuilder(templates[t]); setSavedDraftId(''); };
  const selectedStyle = useMemo(() => RESUME_STYLES.find((s) => s.id === resumeStyle) || RESUME_STYLES[0], [resumeStyle]);
  const photoEnabledForTemplate = true;
  const showField = (...tokens: string[]) => {
    const f = fieldFilter.trim().toLowerCase();
    if (!f) return true;
    return tokens.join(' ').toLowerCase().includes(f);
  };

  const saveDraft = () => {
    const saved = saveResumeDraftToStorage(toDraft(builder, savedDraftId || undefined));
    setSavedDraftId(saved.id); setSavedStatus(`Saved at ${new Date(saved.updatedAt).toLocaleTimeString()}`); setTimeout(() => setSavedStatus(''), 2000);
  };
  const loadDraft = (id: string) => { const d = getSavedResumeDrafts().find((x) => x.id === id); if (!d) return; setBuilder(fromDraft(d)); setSavedDraftId(d.id); };

  const normalizeUrl = (link: string) => (link.startsWith('http') ? link : `https://${link}`);
  const safeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const buildResumeDocumentHtml = (forPreview = false) => {
    const primary = selectedStyle.primary;
    const pageBg = selectedStyle.bg;
    const links = splitCsv(builder.links);
    const skills = splitCsv(builder.skills);
    const certifications = splitCsv(builder.certifications);
    const achievements = splitCsv(builder.achievements);
    const hasPhoto = photoEnabledForTemplate && Boolean(builder.photoUrl.trim());
    const photoHtml = hasPhoto
      ? `<img src="${safeHtml(builder.photoUrl.trim())}" alt="profile" class="photo" />`
      : photoEnabledForTemplate
        ? `<div class="photo placeholder" data-photo-trigger="1">${forPreview ? 'Add Photo' : 'Photo'}</div>`
        : '';

    const section = (title: string, content: string) => content ? `<section><h3>${title}</h3>${content}</section>` : '';
    const summaryHtml = builder.summary.trim() ? `<p>${safeHtml(builder.summary)}</p>` : '';
    const skillsHtml = skills.length ? `<div class="chips">${skills.map((s) => `<span class="chip">${safeHtml(s)}</span>`).join('')}</div>` : '';
    const linksHtml = links.length ? `<p class="links">${links.map((x) => `<a href="${safeHtml(normalizeUrl(x))}" target="_blank" rel="noopener noreferrer">${safeHtml(x)}</a>`).join(' | ')}</p>` : '';
    const expHtml = textToLines(builder.experience).map((line) => {
      const [role = '', company = '', duration = '', points = ''] = line.split('|').map((x) => x.trim());
      const items = points.split(';').map((x) => x.trim()).filter(Boolean);
      return `<div class="item"><p><strong>${safeHtml(role)}</strong> - ${safeHtml(company)} <span class="muted">${safeHtml(duration)}</span></p>${items.length ? `<ul>${items.map((p) => `<li>${safeHtml(p)}</li>`).join('')}</ul>` : ''}</div>`;
    }).join('');
    const projHtml = textToLines(builder.projects).map((line) => {
      const [name = '', tech = '', link = '', points = ''] = line.split('|').map((x) => x.trim());
      const items = points.split(';').map((x) => x.trim()).filter(Boolean);
      const linkText = link ? `<a href="${safeHtml(normalizeUrl(link))}" target="_blank" rel="noopener noreferrer">${safeHtml(link)}</a>` : '';
      return `<div class="item"><p><strong>${safeHtml(name)}</strong> ${tech ? `(${safeHtml(tech)})` : ''} ${linkText}</p>${items.length ? `<ul>${items.map((p) => `<li>${safeHtml(p)}</li>`).join('')}</ul>` : ''}</div>`;
    }).join('');
    const eduHtml = textToLines(builder.education).map((line) => {
      const [degree = '', institute = '', year = '', score = ''] = line.split('|').map((x) => x.trim());
      return `<p><strong>${safeHtml(degree)}</strong> - ${safeHtml(institute)} <span class="muted">${safeHtml(year)} ${score ? `| ${safeHtml(score)}` : ''}</span></p>`;
    }).join('');
    const certHtml = certifications.length ? `<p>${certifications.map(safeHtml).join(' | ')}</p>` : '';
    const achHtml = achievements.length ? `<ul>${achievements.map((x) => `<li>${safeHtml(x)}</li>`).join('')}</ul>` : '';

    const sections: Record<string, string> = {
      summary: section('Professional Summary', summaryHtml),
      skills: section('Technical Skills', skillsHtml),
      experience: section('Professional Experience', expHtml),
      projects: section('Projects', projHtml),
      education: section('Education', eduHtml),
      certifications: section('Certifications', certHtml),
      achievements: section('Achievements', achHtml),
    };

    const renderOrder = (keys: string[]) => keys.map((k) => sections[k]).join('');
    const infoBlock = `<p>${safeHtml(builder.email)} | ${safeHtml(builder.phone)} | ${safeHtml(builder.location)}</p>${linksHtml}`;
    const headerPhoto = photoEnabledForTemplate && (hasPhoto || forPreview) ? `<div class="head-photo">${photoHtml}</div>` : '';
    const header = `<header class="head ${photoEnabledForTemplate && (hasPhoto || forPreview) ? 'with-photo' : ''}"><div><h1>${safeHtml(builder.fullName || 'Your Name')}</h1><h2>${safeHtml(builder.title || 'Your Title')}</h2>${infoBlock}</div>${headerPhoto}</header>`;
    const standardBody = renderOrder(['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements']);
    const mainOnly = renderOrder(['experience', 'projects', 'education']);
    const sideOnly = renderOrder(['summary', 'skills', 'certifications', 'achievements']);

    let bodyLayout = `${header}${standardBody}`;
    if (selectedStyle.layout === 'two_column_sidebar') {
      bodyLayout = `${header}<div class="two-col"><aside>${sideOnly}</aside><main>${renderOrder(['experience', 'projects', 'education'])}</main></div>`;
    } else if (selectedStyle.layout === 'split_header') {
      bodyLayout = `<div class="top-split"><div>${header}</div><div class="mini-frame">${sections.summary}${sections.skills}</div></div><main>${renderOrder(['experience', 'projects', 'education', 'certifications', 'achievements'])}</main>`;
    } else if (selectedStyle.layout === 'skills_left_rail') {
      bodyLayout = `${header}<div class="two-col rail"><aside>${renderOrder(['skills', 'summary', 'certifications'])}</aside><main>${renderOrder(['experience', 'projects', 'education', 'achievements'])}</main></div>`;
    } else if (selectedStyle.layout === 'experience_first') {
      bodyLayout = `${header}${renderOrder(['experience', 'projects', 'skills', 'summary', 'education', 'certifications', 'achievements'])}`;
    } else if (selectedStyle.layout === 'projects_first') {
      bodyLayout = `${header}${renderOrder(['projects', 'experience', 'skills', 'summary', 'education', 'certifications', 'achievements'])}`;
    } else if (selectedStyle.layout === 'compact_blocks') {
      bodyLayout = `${header}<div class="compact-grid">${renderOrder(['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'])}</div>`;
    } else if (selectedStyle.layout === 'timeline') {
      bodyLayout = `${header}<main>${renderOrder(['summary', 'skills'])}<section><h3>Career Timeline</h3><div class="timeline">${expHtml || projHtml}</div></section>${renderOrder(['projects', 'education', 'certifications', 'achievements'])}</main>`;
    } else if (selectedStyle.layout === 'hybrid_grid') {
      bodyLayout = `${header}<div class="hybrid"><main>${mainOnly}</main><aside>${sideOnly}${sections.education}</aside></div>`;
    } else if (selectedStyle.layout === 'banded_profile') {
      bodyLayout = `${header}<main class="banded">${renderOrder(['summary', 'experience', 'education', 'skills', 'certifications', 'achievements', 'projects'])}</main>`;
    } else if (selectedStyle.layout === 'profile_frame') {
      bodyLayout = `<header class="head frame"><div class="photo-wrap">${photoHtml}</div><div><h1>${safeHtml(builder.fullName || 'Your Name')}</h1><h2>${safeHtml(builder.title || 'Your Title')}</h2>${infoBlock}</div></header><div class="two-col"><aside>${renderOrder(['summary', 'skills', 'certifications'])}</aside><main>${renderOrder(['experience', 'projects', 'education', 'achievements'])}</main></div>`;
    }

    const previewScript = forPreview
      ? `<script>
      (function () {
        document.body.contentEditable = 'true';
        document.body.spellcheck = false;
        function notifySelection() {
          var sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) {
            window.parent.postMessage({ type: 'resume-selection', text: '' }, '*');
            return;
          }
          var text = (sel.toString() || '').trim();
          if (!text) {
            window.parent.postMessage({ type: 'resume-selection', text: '' }, '*');
            return;
          }
          var range = sel.getRangeAt(0);
          var rect = range.getBoundingClientRect();
          var node = sel.anchorNode && sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
          var computed = node ? window.getComputedStyle(node) : null;
          var size = computed ? parseInt(computed.fontSize, 10) : 12;
          var bold = computed ? (parseInt(computed.fontWeight, 10) >= 600 || computed.fontWeight === 'bold') : false;
          var align = computed && computed.textAlign ? computed.textAlign : 'left';
          if (align !== 'center' && align !== 'right') align = 'left';
          window.parent.postMessage({
            type: 'resume-selection',
            text: text,
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY - 42,
            fontSize: isNaN(size) ? 12 : size,
            bold: !!bold,
            align: align
          }, '*');
        }
        document.addEventListener('mouseup', notifySelection);
        document.addEventListener('keyup', notifySelection);
        document.addEventListener('click', function (e) {
          var target = e.target;
          if (target && target.closest && target.closest('[data-photo-trigger=\"1\"]')) {
            window.parent.postMessage({ type: 'resume-photo-click' }, '*');
          }
        });
      })();
      </script>`
      : '';

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeHtml(builder.fullName || 'Resume')}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: ${resumeFont}, Arial, sans-serif; color: #111827; line-height: 1.35; background: ${pageBg}; margin: 0; font-size: 12px; }
      .page { width: 100%; box-sizing: border-box; }
      h1 { margin: 0; font-size: 26px; }
      h2 { margin: 4px 0 0 0; color: ${primary}; font-size: 16px; }
      h3 { margin: 10px 0 6px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid ${primary}50; padding-bottom: 3px; color: ${primary}; letter-spacing: .4px; }
      p { margin: 3px 0; }
      ul { margin: 4px 0 6px 16px; padding: 0; }
      li { margin: 2px 0; }
      a { color: ${primary}; text-decoration: none; }
      .head { border-bottom: 2px solid ${primary}55; padding-bottom: 8px; margin-bottom: 8px; }
      .head.with-photo { display: grid; grid-template-columns: 1fr 84px; gap: 10px; align-items: center; }
      .head-photo { display: flex; justify-content: flex-end; }
      .head.frame { display: grid; grid-template-columns: 88px 1fr; gap: 10px; align-items: center; }
      .photo { width: ${photoFrameSize}px; height: ${photoFrameSize}px; object-fit: cover; border-radius: 8px; border: 1px solid ${primary}55; }
      .photo.placeholder { display: grid; place-items: center; background: #f3f4f6; color: #6b7280; font-size: 10px; border: 1px dashed ${primary}66; cursor: pointer; }
      .photo-wrap { display: flex; justify-content: center; }
      .links { font-size: 11px; }
      .muted { color: #6b7280; font-size: 11px; }
      .item { margin-bottom: 6px; }
      .chips { display: flex; flex-wrap: wrap; gap: 4px; }
      .chip { border: 1px solid ${selectedStyle.chipBorder}; background: ${selectedStyle.chipBg}; border-radius: 999px; padding: 2px 7px; font-size: 10px; }
      .two-col { display: grid; grid-template-columns: 32% 1fr; gap: 10px; }
      .two-col.rail { grid-template-columns: 34% 1fr; }
      .top-split { display: grid; grid-template-columns: 1fr 32%; gap: 10px; align-items: start; }
      .mini-frame { border: 1px solid ${primary}35; padding: 8px; border-radius: 6px; }
      .compact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .compact-grid section:nth-child(1),
      .compact-grid section:nth-child(3),
      .compact-grid section:nth-child(4),
      .compact-grid section:nth-child(5) { grid-column: span 2; }
      .hybrid { display: grid; grid-template-columns: 1fr 36%; gap: 10px; }
      .timeline .item { border-left: 2px solid ${primary}65; padding-left: 8px; margin-left: 4px; }
      .banded section h3 { background: #f1f1f1; border: 0; padding: 6px 8px; font-size: 12px; }
      section { break-inside: avoid; }
    </style>
  </head>
  <body>
    <div class="page">${bodyLayout}</div>
    ${previewScript}
  </body>
</html>`;
  };

  const getPreviewDocument = () => resumeIframeRef.current?.contentDocument || null;

  const syncPreviewHtml = () => {
    const doc = getPreviewDocument();
    if (!doc) return;
    setPreviewHtml(`<!doctype html>${doc.documentElement.outerHTML}`);
  };

  const previewExec = (command: string, value?: string) => {
    const doc = getPreviewDocument();
    const win = resumeIframeRef.current?.contentWindow;
    if (!doc || !win) return;
    win.focus();
    doc.execCommand(command, false, value);
    syncPreviewHtml();
  };

  const adjustPreviewFont = (delta: number) => {
    const doc = getPreviewDocument();
    const win = resumeIframeRef.current?.contentWindow;
    if (!doc || !win) return;
    const sel = win.getSelection?.();
    if (!sel || sel.rangeCount === 0) return;
    const selected = sel.toString();
    if (!selected.trim()) return;
    const nextSize = Math.max(9, Math.min(40, (previewToolbar.fontSize || 12) + delta));
    win.focus();
    doc.execCommand('insertHTML', false, `<span style="font-size:${nextSize}px;line-height:1.35;">${safeHtml(selected)}</span>`);
    setPreviewToolbar((p) => ({ ...p, fontSize: nextSize }));
    syncPreviewHtml();
  };

  const applyPreviewAlign = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') previewExec('justifyCenter');
    else if (align === 'right') previewExec('justifyRight');
    else previewExec('justifyLeft');
    setPreviewToolbar((p) => ({ ...p, align }));
  };

  const replacePreviewSelection = () => {
    const doc = getPreviewDocument();
    const win = resumeIframeRef.current?.contentWindow;
    if (!doc || !win || !previewToolbar.text) return;
    const updated = window.prompt('Edit selected text', previewToolbar.text);
    if (updated === null) return;
    win.focus();
    doc.execCommand('insertText', false, updated);
    setPreviewToolbar((p) => ({ ...p, text: updated }));
    syncPreviewHtml();
  };

  const aiOptimizePreviewSelection = async () => {
    if (!previewToolbar.text.trim()) {
      setSavedStatus('Select text in preview first');
      setTimeout(() => setSavedStatus(''), 1500);
      return;
    }
    setPreviewAiLoading(true);
    try {
      const prompt = `Optimize only this selected resume text for ATS clarity and impact. Return plain text only. JD=${builder.jd || 'N/A'} Text=${previewToolbar.text}`;
      const reply = await sendChatMessage([], prompt);
      const optimized = cleanAiPlainText(reply);
      if (!optimized) throw new Error('empty');
      const doc = getPreviewDocument();
      const win = resumeIframeRef.current?.contentWindow;
      if (doc && win) {
        win.focus();
        doc.execCommand('insertText', false, optimized);
        setPreviewToolbar((p) => ({ ...p, text: optimized }));
        syncPreviewHtml();
      }
      setSavedStatus('Preview selection optimized');
    } catch {
      setSavedStatus('Preview optimization failed');
    } finally {
      setPreviewAiLoading(false);
      setTimeout(() => setSavedStatus(''), 1800);
    }
  };

  const downloadBlob = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDocx = () => {
    const html = previewHtml || buildResumeDocumentHtml();
    downloadBlob(`${slugify(builder.fullName || 'resume')}.docx`, new Blob(['\ufeff', html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
  };

  const exportDoc = () => {
    const html = previewHtml || buildResumeDocumentHtml();
    downloadBlob(`${slugify(builder.fullName || 'resume')}.doc`, new Blob(['\ufeff', html], { type: 'application/msword' }));
  };

  const exportTxt = () => {
    const text = [
      `${builder.fullName}`,
      `${builder.title}`,
      `${builder.email} | ${builder.phone} | ${builder.location}`,
      '',
      'SUMMARY',
      builder.summary,
      '',
      'SKILLS',
      builder.skills,
      '',
      'EXPERIENCE',
      builder.experience,
      '',
      'PROJECTS',
      builder.projects,
      '',
      'EDUCATION',
      builder.education,
      '',
      'CERTIFICATIONS',
      builder.certifications,
      '',
      'ACHIEVEMENTS',
      builder.achievements,
    ].join('\n');
    downloadBlob(`${slugify(builder.fullName || 'resume')}.txt`, new Blob([text], { type: 'text/plain;charset=utf-8' }));
  };

  const exportPdfA4 = () => {
    const html = previewHtml || buildResumeDocumentHtml();
    const popup = window.open('', '_blank', 'width=900,height=1100');
    if (!popup) {
      setSavedStatus('Please allow popups for PDF export');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 300);
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

  const uploadProfilePhoto = async (file?: File | null) => {
    if (!file) return;
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    setBuilder((prev) => ({ ...prev, photoUrl: base64 }));
    setSavedStatus('Profile photo updated');
    setTimeout(() => setSavedStatus(''), 1800);
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
        <button onClick={() => setTab('analyzer')} className={`px-4 py-2 rounded ${tab === 'analyzer' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Resume Analyzer</button>
        <button onClick={() => setTab('builder')} className={`px-4 py-2 rounded ${tab === 'builder' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Resume Builder</button>
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
          <section className="resume-builder-panel bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3 max-h-[82vh] overflow-y-auto">
            <h2 className="text-white text-xl font-bold">Resume Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                placeholder="Quick field filter (e.g. skills, project, jd)"
                className="resume-field rounded px-3 py-2 md:col-span-2"
              />
              <button type="button" onClick={() => setFieldFilter('')} className="px-3 py-2 rounded bg-slate-700 text-white">
                Clear Filter
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(['fresher', 'experienced', 'fullstack', 'backend', 'data_analyst', 'devops'] as TemplateId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`p-2 rounded border text-sm ${builder.templateId === t ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 text-slate-300'}`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="text-xs text-slate-300">Resume Font</label>
              <select
                value={resumeFont}
                onChange={(e) => setResumeFont(e.target.value as ResumeFont)}
                className="resume-field rounded px-3 py-2"
              >
                <option>Calibri</option>
                <option>Arial</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Verdana</option>
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Example Resume Templates (Editable)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {RESUME_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setResumeStyle(style.id)}
                    className={`p-2 rounded border text-left ${resumeStyle === style.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/30'}`}
                  >
                    <p className="text-sm font-semibold text-white">{style.label}</p>
                    <p className="text-[11px] text-slate-300">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ATS Score Widget - Separate from Resume */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border border-emerald-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-emerald-100">ATS Compatibility Score</p>
                <p className={`text-xl font-bold ${ats >= 75 ? 'text-emerald-400' : ats >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{ats}%</p>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full transition-all ${ats >= 75 ? 'bg-emerald-400' : ats >= 55 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${ats}%` }} />
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-2">
                Real-time score updates when you edit resume content and job description.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">ATS Benchmark Models</p>
                <p className="text-xs text-slate-400">JD Match: {atsInsights.matchRate}%</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Modeled estimates inspired by common ATS checkers. This is an in-app simulation, not a direct API from those platforms.
              </p>
              <div className="mt-3 space-y-2">
                {atsInsights.modelScores.map((m) => (
                  <div key={m.name} className="rounded border border-slate-700 bg-slate-900/60 p-2">
                    <div className="flex items-center justify-between">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-300 hover:underline">
                        {m.name}
                      </a>
                      <span className="text-xs text-slate-200">{m.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{m.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-300">Top Missing JD Keywords</p>
                {atsInsights.jdTermsCount === 0 ? (
                  <p className="text-[11px] text-slate-500 mt-1">Add a target job description to get keyword-level scoring.</p>
                ) : atsInsights.missingTerms.length === 0 ? (
                  <p className="text-[11px] text-emerald-300 mt-1">Great match. Most detected JD keywords are present.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {atsInsights.missingTerms.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-300 mb-1">ATS Input Quality Checks</p>
                <div className="space-y-1">
                  {atsInsights.checks.map((check) => (
                    <div key={check.label} className="rounded border border-slate-700 bg-slate-900/60 p-2">
                      <p className={`text-[11px] font-semibold ${check.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {check.ok ? 'PASS' : 'FIX'}: {check.label}
                      </p>
                      {!check.ok && <p className="text-[11px] text-slate-400 mt-1">{check.fix}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <details open className="rounded border border-slate-700 bg-slate-800/40 p-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-200">Basic Details</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {showField('draft', 'name') && <input value={builder.name} onChange={(e) => update('name', e.target.value)} placeholder="Draft Name" className="resume-field rounded px-3 py-2" />}
                {showField('full', 'name') && <input value={builder.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Full Name" className="resume-field rounded px-3 py-2" />}
                {showField('title', 'role') && <input value={builder.title} onChange={(e) => update('title', e.target.value)} placeholder="Title" className="resume-field rounded px-3 py-2" />}
                {showField('location') && <input value={builder.location} onChange={(e) => update('location', e.target.value)} placeholder="Location" className="resume-field rounded px-3 py-2" />}
                {showField('email') && <input value={builder.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="resume-field rounded px-3 py-2" />}
                {showField('phone') && <input value={builder.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" className="resume-field rounded px-3 py-2" />}
              </div>
            </details>
            {photoEnabledForTemplate ? (
              <div className="space-y-2 rounded border border-slate-700 bg-slate-800/40 p-2">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => photoFileInputRef.current?.click()} className="px-3 py-2 rounded bg-slate-700 text-white">Add New Pic</button>
                  <button type="button" onClick={() => update('photoUrl', '')} className="px-3 py-2 rounded bg-slate-600 text-white">Remove Picture</button>
                  <p className="text-[11px] text-slate-400 self-center">Use frame size to adjust the picture box.</p>
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void uploadProfilePhoto(e.target.files?.[0] || null);
                      e.currentTarget.value = '';
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="text-[11px] text-slate-300">
                    Frame Size: {photoFrameSize}px
                    <input
                      type="range"
                      min={56}
                      max={120}
                      value={photoFrameSize}
                      onChange={(e) => setPhotoFrameSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">This template does not use profile photo.</p>
            )}
            <details open className="rounded border border-slate-700 bg-slate-800/40 p-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-200">Resume Content</summary>
              <div className="mt-2 space-y-2">
                {showField('links', 'linkedin', 'github') && <textarea value={builder.links} onChange={(e) => update('links', e.target.value)} placeholder="Links: comma separated" className="resume-field w-full h-16 rounded px-3 py-2" />}
                {showField('summary', 'profile') && <textarea value={builder.summary} onChange={(e) => update('summary', e.target.value)} placeholder="Summary" className="resume-field w-full h-20 rounded px-3 py-2" />}
                {showField('skills', 'tech') && <textarea value={builder.skills} onChange={(e) => update('skills', e.target.value)} placeholder="Skills: comma separated" className="resume-field w-full h-16 rounded px-3 py-2" />}
                {showField('experience', 'work') && <textarea value={builder.experience} onChange={(e) => update('experience', e.target.value)} placeholder="Experience (each line): Role | Company | Duration | point1; point2" className="resume-field w-full h-24 rounded px-3 py-2" />}
                {showField('projects', 'project') && <textarea value={builder.projects} onChange={(e) => update('projects', e.target.value)} placeholder="Projects (each line): Name | Tech | Link | point1; point2" className="resume-field w-full h-24 rounded px-3 py-2" />}
                {showField('education', 'degree') && <textarea value={builder.education} onChange={(e) => update('education', e.target.value)} placeholder="Education (each line): Degree | Institute | Year | Score" className="resume-field w-full h-20 rounded px-3 py-2" />}
                {showField('certification', 'certificate') && <textarea value={builder.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="Certifications: comma separated" className="resume-field w-full h-14 rounded px-3 py-2" />}
                {showField('achievement', 'awards') && <textarea value={builder.achievements} onChange={(e) => update('achievements', e.target.value)} placeholder="Achievements: comma separated" className="resume-field w-full h-14 rounded px-3 py-2" />}
                {showField('jd', 'job description', 'ats') && <textarea value={builder.jd} onChange={(e) => update('jd', e.target.value)} placeholder="Job Description for ATS and AI tailoring" className="resume-field w-full h-24 rounded px-3 py-2" />}
              </div>
            </details>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveDraft} className="px-3 py-2 rounded bg-blue-600 text-white">Save Draft</button>
              <button onClick={exportDocx} className="px-3 py-2 rounded bg-indigo-600 text-white">DOCX</button>
              <button onClick={exportDoc} className="px-3 py-2 rounded bg-indigo-700 text-white">DOC</button>
              <button onClick={exportPdfA4} className="px-3 py-2 rounded bg-cyan-600 text-white">PDF (A4)</button>
              <button onClick={exportTxt} className="px-3 py-2 rounded bg-slate-600 text-white">TXT</button>
              <button onClick={tailorToJD} disabled={tailorLoading} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">{tailorLoading ? 'Tailoring...' : 'Tailor to JD'}</button>
              {savedDraftId && <button onClick={() => { deleteSavedResumeDraft(savedDraftId); setSavedDraftId(''); setSavedStatus('Draft deleted'); }} className="px-3 py-2 rounded bg-red-700 text-white">Delete</button>}
            </div>
            <p className="text-[11px] text-slate-400">Use preview selection toolbar to edit text, AI optimize, bold/normal, and font size.</p>
            {savedStatus && <p className="text-xs text-cyan-300">{savedStatus}</p>}
            <div className="border border-slate-700 rounded p-2 bg-slate-800/40"><p className="text-sm text-white mb-1">Saved Drafts</p>{savedDrafts.slice(0, 6).map((d) => <button key={d.id} onClick={() => loadDraft(d.id)} className="w-full text-left text-xs text-slate-200 border border-slate-700 rounded p-2 mb-1">{d.name} - {new Date(d.updatedAt).toLocaleString()}</button>)}</div>
          </section>

          <section
            ref={resumePreviewRef}
            className="relative text-slate-900 rounded-xl p-8 border shadow-lg"
            style={{
              fontFamily: `${resumeFont}, Arial, sans-serif`,
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              background: selectedStyle.bg,
              borderColor: `${selectedStyle.primary}40`,
            }}
          >
            {previewToolbar.visible && (
              <div
                className="absolute z-20 flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 shadow-lg"
                style={{ left: `${previewToolbar.x}px`, top: `${previewToolbar.y}px` }}
              >
                <button type="button" onClick={replacePreviewSelection} className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">Edit</button>
                <button type="button" onClick={aiOptimizePreviewSelection} disabled={previewAiLoading} className="px-2 py-1 text-xs rounded bg-orange-600 text-white disabled:opacity-60">
                  {previewAiLoading ? 'AI...' : 'AI Optimize'}
                </button>
                <button type="button" onClick={() => previewExec('bold')} className={`px-2 py-1 text-xs rounded ${previewToolbar.bold ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>B</button>
                <button type="button" onClick={() => previewExec('removeFormat')} className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">Normal</button>
                <button type="button" onClick={() => applyPreviewAlign('left')} className={`px-2 py-1 text-xs rounded ${previewToolbar.align === 'left' ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>Left</button>
                <button type="button" onClick={() => applyPreviewAlign('center')} className={`px-2 py-1 text-xs rounded ${previewToolbar.align === 'center' ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>Center</button>
                <button type="button" onClick={() => applyPreviewAlign('right')} className={`px-2 py-1 text-xs rounded ${previewToolbar.align === 'right' ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>Right</button>
                <button type="button" onClick={() => adjustPreviewFont(-1)} className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">-</button>
                <span className="text-[11px] text-slate-500">{previewToolbar.fontSize}px</span>
                <button type="button" onClick={() => adjustPreviewFont(1)} className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">+</button>
              </div>
            )}
            <iframe
              ref={resumeIframeRef}
              title="Resume Preview"
              srcDoc={previewHtml || buildResumeDocumentHtml(true)}
              className="w-full rounded-lg border border-slate-200 bg-white"
              style={{ minHeight: '270mm' }}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;


