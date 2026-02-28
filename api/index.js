import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import Groq from 'groq-sdk';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const app = express();
const upload = multer();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// 1. Parse Resume PDF
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    try {
        const data = await pdf(req.file.buffer);
        const resumeText = data.text;

        res.json({ text: resumeText });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: "Failed to process resume" });
    }
});

// 2. High-Accuracy Audio Transcription (Whisper-large-v3)
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No audio provided" });

        // Use /tmp directory for serverless environments
        const tempFileName = `${Date.now()}.wav`;
        const tempPath = path.join('/tmp', tempFileName);
        
        fs.writeFileSync(tempPath, req.file.buffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: "whisper-large-v3",
            language: "en",
        });

        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath); 
        }
        
        res.json({ text: transcription.text });
    } catch (err) {
        console.error("Groq Whisper Error:", err);
        res.status(500).json({ error: "Transcription failed" });
    }
});

// 3. Chat Logic (Turn-Based Roadmap & Anti-Looping)
app.post('/api/chat', async (req, res) => {
    const { history, resumeText } = req.body;
    const turnCount = Math.floor(history.length / 2); 

    let currentStage = "";
    let stageGoal = "";

    if (turnCount === 0) {
        currentStage = "INTRODUCTION";
        stageGoal = "Briefly welcome the candidate. Ask for a short intro and their core tech stack.";
    } else if (turnCount >= 1 && turnCount <= 3) {
        currentStage = "EXPERIENCE";
        stageGoal = "Pick a specific role/project from the resume. Ask about implementation details, trade-offs, or a challenge. DO NOT repeat a topic discussed in previous turns.";
    } else if (turnCount >= 4 && turnCount <= 6) {
        currentStage = "SKILLS";
        stageGoal = "Identify a technical skill (React, Node, SQL, etc.) from the resume. Ask a 'how it works internally' theory question.";
    } else if (turnCount >= 7 && turnCount <= 9) {
        currentStage = "ACHIEVEMENTS";
        stageGoal = "Ask about a specific Rank, Award, or Hackathon win. Ask about the hardest technical hurdle faced to achieve it.";
    } else if (turnCount >= 10 && turnCount <= 11) {
        currentStage = "GENERAL/SYSTEM DESIGN";
        stageGoal = "Ask a behavioral question or a system design question related to their background.";
    } else {
        return res.json({ reply: "Thank you for your time. That concludes our interview." });
    }

    const systemInstruction = `
    ROLE: Software Engineer
    INTERVIEW STAGE: ${currentStage} (Turn ${turnCount}/12).
    GOAL: ${stageGoal}
    RESUME CONTEXT: """${resumeText}""" 
    STRICT RULES:
    1. **NO INTRODUCTIONS**: After turn 0, never ask "tell me about yourself." 
    2. **DYNAMIC TOPICS**: Check history. If you just asked about "Role A," you MUST switch to "Role B" or "Project C" now.
    3. **SPECIFICITY**: Mention specific nouns (Company/Project/Skill names) found in the RESUME CONTEXT.
    4. **BREVITY**: Keep questions under 2 sentences. No meta-talk like "Moving to the next stage."
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction }, 
                ...history.map(m => ({ 
                    role: m.sender === 'user' ? 'user' : 'assistant', 
                    content: m.text 
                }))
            ],
            model: "llama-3.1-8b-instant", 
            temperature: 0.4,
        });
        res.json({ reply: completion.choices[0]?.message?.content });
    } catch (err) { 
        console.error("Chat Error:", err);
        res.status(500).json({ error: "AI Error - Check TPD Limits" }); 
    }
});

// 4. Detailed Feedback Logic
app.post('/api/feedback', async (req, res) => {
    const { history, resumeText } = req.body;
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ 
                role: "user", 
                content: `Act as a Google Hiring Committee. 
                Analyze this interview transcript for the candidate based on their resume: ${resumeText}.
                Transcript: ${JSON.stringify(history)}
                Return ONLY a JSON object with this exact structure:
                {
                  "overall_score": 0-100,
                  "detailed_metrics": {
                    "technical_depth": 0-100,
                    "communication_clarity": 0-100,
                    "problem_solving": 0-100,
                    "experience_relevance": 0-100
                  },
                  "section_analysis": {
                    "experience": "Detailed review of how they explained past projects.",
                    "technical_skills": "Evaluation of their theoretical core knowledge.",
                    "achievements": "Assessment of the impact/scale of their accomplishments."
                  },
                  "strengths": ["specific strength 1", "specific strength 2"],
                  "areas_for_improvement": ["specific area 1", "specific area 2"],
                  "critical_missing_points": "List specific technical details they missed or failed to explain well.",
                  "hiring_verdict": "Strong Hire / Hire / Leaning No / No Hire",
                  "summary": "A 3-4 sentence professional summary of the candidate's performance."
                }` 
            }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(completion.choices[0]?.message?.content));
    } catch (err) { 
        console.error("Feedback Error:", err);
        res.status(500).json({ error: "Feedback Generation Failed" }); 
    }
});

// Export the app for Vercel
export default app;

// Add this so it can run locally when doing `node api/index.js`
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}