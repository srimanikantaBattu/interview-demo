const fs = require('fs');
const path = require('path');

// --- 1. Define File Contents ---

const packageJson = `{
  "name": "ai-voice-interviewer",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start-server": "node api/index.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.1.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "lucide-react": "^0.292.0",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0"
  }
}`;

const vercelJson = `{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}`;

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})`;

const tailwindConfig = `export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`;

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const envFile = `GEMINI_API_KEY=PASTE_YOUR_API_KEY_HERE`;

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Voice Interviewer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

const apiIndexJs = `const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
        const data = await pdf(req.file.buffer);
        res.json({ text: data.text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to parse PDF" });
    }
});

app.post('/api/chat', async (req, res) => {
    const { history, resumeText, message } = req.body;
    const systemPrompt = \`
    You are a professional technical interviewer conducting a VOICE interview. 
    The candidate's resume content is: "\${resumeText ? resumeText.slice(0, 3000) : 'No resume'}...".
    Rules: Ask ONE clear question at a time. Keep responses BRIEF (max 2-3 sentences). 
    If user says "START", welcome them and ask the first question.\`;

    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });
        const result = await chat.sendMessage(
            message === "START" ? \`\${systemPrompt} \\n\\n User says: Ready.\` : message
        );
        res.json({ reply: result.response.text() });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "AI Error" });
    }
});

app.post('/api/feedback', async (req, res) => {
    const { history, resumeText } = req.body;
    const prompt = \`
    The interview is over. Transcript: \${JSON.stringify(history)}
    Resume Context: "\${resumeText ? resumeText.slice(0, 1000) : ''}..."
    Generate JSON with: score (0-100), strengths (array), areas_for_improvement (array), summary (string).
    Return ONLY raw JSON.\`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/\\\`\\\`\\\`json|\\\`\\\`\\\`/g, '').trim();
        res.json(JSON.parse(text));
    } catch (err) {
        console.error("Feedback Error:", err);
        res.status(500).json({ error: "Feedback Failed" });
    }
});

if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
}
module.exports = app;`;

const srcMainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

const srcIndexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}`;

const srcAppJsx = `import { useState } from 'react';
import FileUpload from './components/FileUpload';
import InterviewChat from './components/InterviewChat';
import FeedbackReport from './components/FeedbackReport';

function App() {
  const [stage, setStage] = useState('upload'); 
  const [resumeText, setResumeText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [feedbackData, setFeedbackData] = useState(null);

  const handleUploadSuccess = (text) => {
    setResumeText(text);
    setStage('interview');
  };

  const handleInterviewEnd = async (history) => {
    setChatHistory(history);
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[650px] border border-gray-100">
        {stage === 'upload' && <FileUpload onUpload={handleUploadSuccess} />}
        {stage === 'interview' && <InterviewChat resumeText={resumeText} onEnd={handleInterviewEnd} />}
        {stage === 'feedback' && <FeedbackReport data={feedbackData} />}
      </div>
    </div>
  );
}
export default App;`;

const compFileUpload = `import { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Loader2 } from 'lucide-react';

export default function FileUpload({ onUpload }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post('/api/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(res.data.text);
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-10 bg-slate-50">
      <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Voice Mock Interviewer</h1>
      <p className="text-slate-500 text-lg mb-10">Upload your resume to start.</p>
      <label className="flex flex-col items-center justify-center w-full max-w-xl h-72 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-white hover:bg-blue-50 transition-all shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-blue-600 font-medium">Analyzing Resume...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-blue-600 mb-4" />
            <p className="text-lg text-slate-700 font-semibold">Click to upload PDF</p>
          </>
        )}
        <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={loading} />
      </label>
    </div>
  );
}`;

const compInterviewChat = `import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Clock, User, Bot } from 'lucide-react';

export default function InterviewChat({ resumeText, onEnd }) {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); 
  const [processing, setProcessing] = useState(false);
  
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    sendMessage("START", true);
    return () => synth.cancel();
  }, []);

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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speakText = (text) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synth.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) { recognitionRef.current.stop(); } 
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const sendMessage = async (text, isSystem = false) => {
    if (!text) return;
    const newMsg = { sender: 'user', text };
    if (!isSystem) setMessages(prev => [...prev, newMsg]);
    setProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: isSystem ? [] : [...messages, newMsg], resumeText, message: text })
      });
      const data = await response.json();
      setMessages(prev => [...(isSystem ? [] : prev), ...(isSystem ? [] : [newMsg]), { sender: 'ai', text: data.reply }]);
      speakText(data.reply);
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \`\${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white">
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white shadow-md">
        <h2 className="font-bold flex items-center gap-2 text-lg"><Volume2 className="text-blue-400" /> Voice Interview</h2>
        <div className="font-mono text-xl">{formatTime(timeLeft)}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={\`flex \${msg.sender === 'user' ? 'justify-end' : 'justify-start'}\`}>
             <div className={\`p-4 rounded-2xl shadow-sm max-w-[80%] \${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}\`}>{msg.text}</div>
          </div>
        ))}
        {(processing || isSpeaking) && <div className="pl-12 text-xs font-semibold text-slate-400 animate-pulse uppercase tracking-wider">{processing ? 'Thinking...' : 'Speaking...'}</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-8 bg-white border-t border-slate-100 flex flex-col items-center justify-center">
        <button onClick={toggleListening} disabled={processing || isSpeaking} className={\`flex items-center justify-center w-20 h-20 rounded-full transition-all shadow-xl \${isListening ? 'bg-red-500 scale-110' : 'bg-slate-900 hover:scale-105'}\`}>
          {isListening ? <MicOff size={32} color="white" /> : <Mic size={32} color="white" />}
        </button>
      </div>
    </div>
  );
}`;

const compFeedbackReport = `import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FeedbackReport({ data }) {
  if (!data) return (
      <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-800">Generating Report...</h2>
      </div>
  );
  return (
    <div className="h-full min-h-[600px] overflow-y-auto p-10 bg-white">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Analysis Report</h1>
        <div className="mt-6 inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-blue-100 bg-blue-50">
           <span className="text-4xl font-black text-blue-600">{data.score}</span>
        </div>
      </div>
      <div className="space-y-6 max-w-3xl mx-auto">
        <p className="text-slate-600 p-4 bg-slate-50 rounded-xl">{data.summary}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-700 mb-4">Strengths</h3>
            <ul className="space-y-2">{data.strengths?.map((item, i) => <li key={i} className="text-sm text-green-800">• {item}</li>)}</ul>
          </section>
          <section className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h3 className="font-bold text-amber-700 mb-4">Improvements</h3>
            <ul className="space-y-2">{data.areas_for_improvement?.map((item, i) => <li key={i} className="text-sm text-amber-900">• {item}</li>)}</ul>
          </section>
        </div>
      </div>
      <div className="mt-12 text-center pb-8">
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold">New Interview</button>
      </div>
    </div>
  );
}`;

// --- 2. Create Structure ---

const dirs = [
  'api',
  'public',
  'src',
  'src/components'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// --- 3. Write Files ---

const files = {
  'package.json': packageJson,
  'vercel.json': vercelJson,
  'vite.config.js': viteConfig,
  'tailwind.config.js': tailwindConfig,
  'postcss.config.js': postcssConfig,
  '.env': envFile,
  'index.html': indexHtml,
  'api/index.js': apiIndexJs,
  'src/main.jsx': srcMainJsx,
  'src/index.css': srcIndexCss,
  'src/App.jsx': srcAppJsx,
  'src/components/FileUpload.jsx': compFileUpload,
  'src/components/InterviewChat.jsx': compInterviewChat,
  'src/components/FeedbackReport.jsx': compFeedbackReport,
};

Object.entries(files).forEach(([fileName, content]) => {
  fs.writeFileSync(fileName, content);
  console.log(`Created file: ${fileName}`);
});

console.log("\n✅ Setup complete!");
console.log("👉 Step 1: Run 'npm install'");
console.log("👉 Step 2: Open .env file and paste your Gemini API Key");
console.log("👉 Step 3: Run 'node api/index.js' in one terminal");
console.log("👉 Step 4: Run 'npm run dev' in another terminal");