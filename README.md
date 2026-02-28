# GetMock AI
### Personalised AI Interviewer with Detailed Feedback

GetMock AI is a full-stack platform designed to bridge the gap between candidate preparation and real-world technical interviews via targeted mock interviewing. Built with React on the frontend and Express.js on the backend, it uses AI models (Groq, Llama 3.1, Whisper v3) to perform voice-to-text transcriptions, read resumes, and grade specific interview metrics seamlessly.

## Getting Started

### Prerequisites
- Node.js **v18+**
- [Groq Cloud API Key](https://console.groq.com/keys)

### Installation

Clone the repository:
\\\ash
git clone https://github.com/srimanikantaBattu/interview-demo.git
cd interview-demo
\\\

Install dependencies:
\\\ash
npm install
\\\

### Environment Setup

Create a \.env\ file in the root of the project with the following variable:
\\\env
GROQ_API_KEY=your_groq_api_key_here
\\\

### Running the Project locally

The project requires both the backend and frontend servers to run concurrently.

1. Start the Backend Server (Terminal 1)
\\\ash
node api/index.js
\\\

2. Start the Frontend Server (Terminal 2)
\\\ash
npm run dev
\\\

The app will now be accessible from the Vite localhost link provided in Terminal 2 (usually \http://localhost:5173\)!
