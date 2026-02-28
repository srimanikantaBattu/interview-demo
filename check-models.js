// check-models.js
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function checkModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      return;
    }

    console.log("\n✅ AVAILABLE MODELS FOR YOUR KEY:");
    console.log("---------------------------------");
    const models = data.models || [];
    
    // Filter for models that support "generateContent"
    const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    chatModels.forEach(m => {
      console.log(`Name: ${m.name.replace("models/", "")}`);
    });
    console.log("---------------------------------\n");
    
  } catch (error) {
    console.error("Script failed:", error);
  }
}

checkModels();