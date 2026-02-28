import { useState } from 'react';
import { 
  Mic, Zap, ArrowLeft, Radio, ArrowRight, Play, 
  ShieldCheck, BarChart3, Cpu, Code2, Terminal, 
  ChevronRight, Activity, Command, Globe, Server,
  Layers, Database, PieChart, BookOpen, Fingerprint
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import InterviewChat from './components/InterviewChat';
import FeedbackReport from './components/FeedbackReport';

export default function App() {
  const [stage, setStage] = useState('landing'); 
  const [resumeText, setResumeText] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);

  const handleStart = () => setStage('upload');
  const handleBack = () => {
    setStage('landing');
    setFeedbackData(null);
  };

  const handleUploadSuccess = (text) => {
    setResumeText(text);
    setStage('interview');
  };

  const handleInterviewEnd = async (history) => {
    setStage('feedback');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, resumeText })
      });
      const data = await response.json();
      setFeedbackData(data);
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] selection:bg-emerald-500/30 font-sans text-slate-400 overflow-x-hidden antialiased">
      {/* DESIGN POLISH: 
          Added tiered radial gradients to create a 'Green-Mist' atmosphere 
      */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[70%] h-[50%] bg-emerald-500/[0.07] blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/[0.03] blur-[100px] rounded-full" />
      </div>

      {stage === 'landing' ? (
        <LandingContent onStart={handleStart} />
      ) : (
        <div className="relative z-10 flex items-center justify-center p-4 md:p-8 min-h-screen animate-in fade-in zoom-in duration-1000">
          <div className="w-full max-w-5xl bg-white/[0.01] backdrop-blur-[40px] border border-white/[0.06] rounded-[48px] overflow-hidden min-h-[820px] flex flex-col shadow-[0_0_120px_rgba(16,185,129,0.05)]">
            
            {/* Header: Emerald Accented */}
            <header className="flex justify-between items-center px-12 py-8 border-b border-white/[0.04] bg-black/40">
              <button 
                onClick={handleBack}
                className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-emerald-400 transition-all"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                Exit Terminal
              </button>
              
              <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-emerald-500/[0.03] border border-emerald-500/10">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">System Live</span>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {stage === 'upload' && <FileUpload onUpload={handleUploadSuccess} />}
              {stage === 'interview' && <InterviewChat resumeText={resumeText} onEnd={handleInterviewEnd} />}
              {stage === 'feedback' && <FeedbackReport data={feedbackData} />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

function LandingContent({ onStart }) {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-8">
      {/* 1. Navbar */}
      <nav className="flex justify-between items-center py-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <Command size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white italic">GetMock AI</span>
        </div>
        <button onClick={onStart} className="px-8 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5">
          Start Interview
        </button>
      </nav>

      {/* 2. Hero Section: Design Polish Applied */}
      <section className="pt-32 pb-60 text-center max-w-6xl mx-auto space-y-14">
        <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-emerald-500/[0.05] border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
          AI Interview + Feedback Score
        </div>
        
        {/* Main Text: Gradient Greenery */}
        <h1 className="text-[90px] md:text-[120px] font-bold tracking-[ -0.04em] text-white leading-[0.82] animate-in slide-in-from-bottom-8 duration-1000">
          Unlimited Free <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            Mock Interviews.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium mt-4">
          The industry's first voice-native AI interviewer. We vectorize your resume to <br className="hidden md:block"/> identify details, grill you, and provide comprehensive hiring scores.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
          <button onClick={onStart} className="px-14 py-6 bg-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
            Start Your Interview <ArrowRight size={20} />
          </button>
          <button
  onClick={() =>
    window.open(
      "https://www.youtube.com/watch?v=v5XQAeYzch4",
      "_blank",
      "noopener,noreferrer"
    )
  }
  className="px-14 py-6 bg-white/[0.03] border border-white/[0.08] text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 backdrop-blur-md"
>
  <Play size={18} fill="white" />
  Experience Demo
</button>
        </div>
      </section>

      {/* 3. Performance Metrics Grid: Green Accented */}
      <section id="metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-[48px] overflow-hidden mb-60 shadow-2xl">
        {[
          { label: "Inference", value: "< 1.2s", sub: "Sub-second Logic", color: "text-emerald-400" },
          { label: "Transcription", value: "99.2%", sub: "Whisper v3 Large", color: "text-emerald-400" },
          { label: "Model Logic", value: "Llama 3.1", sub: "8B-Instant Engine", color: "text-emerald-400" },
          { label: "Turn-Based", value: "12 Stage", sub: "Full Career Review", color: "text-emerald-400" }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#030303] p-12 flex flex-col items-center text-center group hover:bg-emerald-500/[0.02] transition-colors">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 group-hover:text-emerald-500 transition-colors">{item.label}</div>
              <div className={`text-5xl font-bold tracking-tighter mb-2 ${item.color}`}>{item.value}</div>
              <div className="text-[10px] font-bold text-slate-700 uppercase">{item.sub}</div>
          </div>
        ))}
      </section>

      {/* 4. Feature Bento Boxes: Polish Touches */}
      <section id="engine" className="pb-60 space-y-8">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8 bg-white/[0.01] border border-white/[0.04] p-16 rounded-[56px] flex flex-col justify-between h-[520px] group hover:border-emerald-500/30 transition-all duration-700 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
              <Layers size={32} />
            </div>
            <div className="space-y-6">
              <h3 className="text-5xl font-bold text-white tracking-tight">Entity Analysis.</h3>
              <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                Our proprietary logic vectorized your resume into 50+ unique technical data points to build a bespoke interview journey.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-4 bg-white/[0.01] border border-white/[0.04] p-12 rounded-[56px] flex flex-col justify-end group hover:border-emerald-500/30 transition-all duration-700 shadow-2xl">
             <div className="mb-20">
                <Database size={80} className="text-emerald-500/30 group-hover:text-emerald-500 group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all" />
             </div>
             <div className="space-y-4">
               <h3 className="text-2xl font-bold text-white tracking-tight">Complete Testing.</h3>
               <p className="text-sm text-slate-500 leading-relaxed font-medium">
                 We go beyond simple Q&A to grill you on architectural trade-offs and internal framework logic.
               </p>
             </div>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 pt-8">
          <div className="md:col-span-4 bg-white/[0.01] border border-white/[0.04] p-12 rounded-[56px] group hover:border-emerald-500/30 transition-all duration-700">
            <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
              <Fingerprint className="text-emerald-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Sentiment Tracking</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Real-time analysis of confidence levels and emotional tone during technical "grilling" sessions.
            </p>
          </div>
          
          <div className="md:col-span-8 bg-white/[0.01] border border-white/[0.04] p-16 rounded-[56px] flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-700">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-bold text-white tracking-tight">Final Analysis.</h3>
              <p className="text-lg text-slate-500 leading-relaxed">
                Comprehensive feedback loops featuring strengths, "Critical Gaps," and domain-specific scoring against 
                FAANG benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Infrastructure Marquee: Emerald Accents */}
      <section className="pb-60 text-center space-y-12">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Enterprise Grade Infrastructure</p>
        <div className="flex flex-wrap justify-center gap-20 grayscale opacity-20 contrast-200 hover:opacity-40 transition-opacity duration-700">
           <div className="text-3xl font-black italic text-emerald-500">GROQ CLOUD</div>
           <div className="text-3xl font-black italic text-emerald-500">WHISPER v3</div>
           <div className="text-3xl font-black italic text-emerald-500">LLAMA 3.1</div>
           <div className="text-3xl font-black italic text-emerald-500">MERN STACK</div>
        </div>
      </section>

      {/* 6. Footer: Refined Links */}
      <footer className="py-20 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500 border border-white/5">
             <Command size={16} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">GetMock AI</span>
        </div>
        <div className="flex gap-14 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <a href="https://github.com/AkshatPandey2006" className="hover:text-emerald-400 transition-colors">GitHub</a>
          <a href="https://www.linkedin.com/in/akshatpandey2006/" className="hover:text-emerald-400 transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}
