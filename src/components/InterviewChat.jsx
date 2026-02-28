import { useState, useEffect, useRef } from 'react';
import { Mic, Zap, Send, Clock, Volume2, ShieldAlert } from 'lucide-react';

export default function InterviewChat({ resumeText, onEnd }) {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); 
  const [processing, setProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const synth = window.speechSynthesis;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial start command to trigger the AI greeting
    sendMessage("START", true);
    return () => {
      synth.cancel();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onEnd(messages); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [messages, onEnd]);

  // Auto-scroll to bottom on new messages
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, processing]);

  const speakText = (text) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synth.speak(utterance);
  };

  const toggleListening = async () => {
    if (isListening) {
      // STOP RECORDING & SEND
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setProcessing(true); 
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'user_voice.wav');

          try {
            const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.text) {
              sendMessage(data.text);
            } else {
              setProcessing(false);
            }
          } catch (err) { 
            console.error("Transcription error:", err);
            setProcessing(false);
          }
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    }
  };

  const sendMessage = async (text, isSystem = false) => {
    if (!text) return;
    
    const newMsg = { sender: 'user', text };
    
    // Add user message to UI unless it's the invisible start command
    if (!isSystem) {
        setMessages(prev => [...prev, newMsg]);
    }
    
    setProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            history: isSystem ? [] : [...messages, newMsg], 
            resumeText, 
            message: text 
        })
      });
      
      const data = await response.json();
      const aiMsg = { sender: 'ai', text: data.reply };
      
      setMessages(prev => isSystem ? [aiMsg] : [...prev, aiMsg]);
      speakText(data.reply);

      // Early exit logic if AI decides the interview is over
      if (data.reply.toLowerCase().includes("concludes our interview")) {
          setTimeout(() => {
              onEnd([...messages, newMsg, aiMsg]); 
          }, 4000);
      }
    } catch (error) { 
      console.error("Chat error:", error); 
    } finally { 
      setProcessing(false); 
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-[750px] bg-black/40">
      {/* Header: Performance Stats */}
      <div className="flex justify-between items-center px-8 py-5 bg-white/[0.02] border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">FAANG-Level Grill Session</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-2xl border border-white/10 glass-card">
          <Clock size={16} className="text-emerald-400" />
          <span className="font-mono text-emerald-400 font-bold text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed shadow-2xl transition-all ${
               msg.sender === 'user' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-50 rounded-tr-none' 
                : 'bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-tl-none'
             }`}>
               {msg.text}
             </div>
          </div>
        ))}
        {/* Thinking Indicator */}
        {(processing || isSpeaking) && (
          <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {processing ? "Analyzing Response..." : "AI Speaking..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Unified Voice Controls */}
      <div className="p-12 border-t border-white/[0.05] bg-black/40 flex flex-col items-center relative overflow-hidden">
        {/* Ambient background glow while active */}
        {isListening && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}
        
        <button 
          onClick={toggleListening} 
          disabled={processing || isSpeaking} 
          className={`group relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-500 shadow-2xl ${
            isListening 
              ? 'bg-emerald-500 scale-110 shadow-[0_0_60px_rgba(16,185,129,0.5)]' 
              : 'bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:scale-105'
          }`}
        >
          {isListening ? (
            <Send size={38} className="text-black group-hover:rotate-12 transition-transform" />
          ) : (
            <Mic size={38} className="text-white group-hover:scale-110 transition-transform" />
          )}
          
          {/* Ripple Effect while listening */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
          )}
        </button>
        
        <div className="mt-8 flex flex-col items-center gap-2">
            <p className={`text-[11px] font-black uppercase tracking-[0.4em] transition-colors ${isListening ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isListening ? "Tap to Submit Answer" : processing ? "Processing Voice Data" : "Begin Speaking"}
            </p>
            {isListening && (
                <div className="flex gap-1 h-3 items-end">
                    {[3,6,4,8,5].map((h, i) => (
                        <div key={i} className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{height: `${h*10}%`, animationDelay: `${i*0.1}s`}} />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}