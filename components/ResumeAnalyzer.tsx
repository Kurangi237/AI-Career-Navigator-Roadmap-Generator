import React, { useState, useRef } from 'react';
import { analyzeDocument } from '../services/geminiService';
import { SkillAnalysisResponse } from '../types';

interface Props {
  onBack: () => void;
}

const ResumeAnalyzer: React.FC<Props> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAnalysis(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await convertToBase64(file);
      const result = await analyzeDocument(base64, file.type);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      alert("Error analyzing document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button 
        onClick={onBack} 
        className="flex items-center text-slate-400 hover:text-white transition-colors group self-start"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Upload Document</h2>
            <p className="text-slate-400 text-sm mb-6">Upload your Resume (PDF/Image) or a Syllabus screenshot to get an AI analysis.</p>
            
            <div 
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf"
              />
              {preview ? (
                <div className="flex flex-col items-center">
                   {file?.type.startsWith('image') ? (
                      <img src={preview} alt="Preview" className="max-h-64 rounded shadow-lg mb-4" />
                   ) : (
                      <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                         <span className="text-2xl">PDF</span>
                      </div>
                   )}
                   <p className="text-sm text-indigo-400 font-medium">{file?.name}</p>
                   <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="mt-2 text-xs text-red-400 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full mt-6 bg-indigo-600 py-3 rounded-lg text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Analyzing with Vision Model...' : 'Analyze Document'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {analysis ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span>
                   Identified Skills
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {analysis.skills_identified.map((skill, i) => (
                     <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">{skill}</span>
                   ))}
                 </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-red-900/20">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500"></span>
                   Gap Analysis (Missing)
                 </h3>
                 <ul className="space-y-2">
                   {analysis.missing_skills.map((skill, i) => (
                     <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                       <span className="text-red-400 mt-0.5">•</span>
                       {skill}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="bg-indigo-900/20 rounded-xl p-6 border border-indigo-500/20">
                 <h3 className="text-lg font-bold text-white mb-4">Recommended Next Steps</h3>
                 <div className="space-y-3">
                   {analysis.improvement_plan.map((step, i) => (
                     <div key={i} className="flex gap-3">
                       <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">{i+1}</span>
                       <p className="text-slate-300 text-sm">{step}</p>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
               {!loading && <p>Upload a file to see insights</p>}
               {loading && (
                   <div className="text-center space-y-4">
                       <div className="animate-pulse w-16 h-16 bg-slate-700 rounded-full mx-auto"></div>
                       <p className="text-slate-400">Gemini 3 Pro is reading your document...</p>
                   </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
