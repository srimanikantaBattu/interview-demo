import React from 'react';
import { Target, BarChart3, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';

export default function FeedbackReport({ data }) {
  if (!data) return <div className="p-20 text-center animate-pulse text-slate-500 uppercase tracking-widest font-black h-full flex items-center justify-center">Synthesizing Feedback...</div>;

  return (
    <div className="p-10 space-y-10 bg-black/40 h-full overflow-y-auto">
      <div className="flex justify-between items-end border-b border-white/[0.05] pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Technical Verdict</h2>
          <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Level: {data.hiring_verdict}
          </div>
        </div>
        <div className="text-right">
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 leading-none">
            {data.overall_score}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Final Rating</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {Object.entries(data.detailed_metrics).map(([key, value]) => (
          <div key={key} className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-3xl group hover:border-emerald-500/30 transition-all">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-emerald-400">{key.replace('_', ' ')}</div>
            <div className="text-2xl font-black text-white">{value}%</div>
            <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 px-2"><CheckCircle2 size={14} className="text-emerald-500" /> Technical Strengths</h3>
          <ul className="space-y-3">
            {data.strengths.map((s, i) => (
              <li key={i} className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl text-sm text-slate-300 transition-colors hover:bg-emerald-500/5">{s}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 px-2"><AlertCircle size={14} className="text-amber-500" /> Critical Gaps</h3>
          <ul className="space-y-3">
            {data.areas_for_improvement.map((a, i) => (
              <li key={i} className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl text-sm text-slate-300 transition-colors hover:bg-amber-500/5">{a}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-10 flex justify-center pb-8">
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
          <RefreshCcw size={18} /> New Session
        </button>
      </div>
    </div>
  );
}