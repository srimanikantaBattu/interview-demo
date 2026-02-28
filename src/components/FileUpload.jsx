import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';

export default function FileUpload({ onUpload }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/upload-resume', { method: 'POST', body: formData });
      const data = await res.json();
      onUpload(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
      <div className="mb-8 space-y-3">
        <h2 className="text-4xl font-black text-white tracking-tighter">Initialize Your Grill</h2>
        <p className="text-slate-500 text-sm font-medium">Upload your resume to generate a custom technical roadmap.</p>
      </div>

      <label className="group relative w-full max-w-md aspect-[16/10] flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-emerald-500/[0.02] hover:border-emerald-500/30 transition-all cursor-pointer overflow-hidden">
        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-emerald-500 animate-spin" size={48} />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Parsing Data...</span>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-3xl bg-white/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
              <Upload className="text-slate-400 group-hover:text-emerald-500" size={32} />
            </div>
            <p className="text-white font-bold">Drop PDF or Click to Browse</p>
          </>
        )}
      </label>

      <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
            <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Privacy</p>
            <p className="text-xs text-slate-400">Data is ephemeral</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
            <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logic</p>
            <p className="text-xs text-slate-400">12-turn deep dive</p>
        </div>
      </div>
    </div>
  );
}