import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): { ai: GoogleGenAI | null; error?: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return { 
      ai: null, 
      error: 'GEMINI_API_KEY environment variable is not configured. Please add your key in the Secrets panel in Settings.' 
    };
  }

  try {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return { ai: aiClient };
  } catch (err: any) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return { ai: null, error: `Initialization error: ${err?.message || err}` };
  }
}

// 1. API ROUTES

// Health / Config Check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: hasKey,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Chatbot Endpoint (Server-Side proxy for Gemini)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, userMessage } = req.body;

  if (!userMessage) {
    res.status(400).json({ error: 'userMessage parameter is required.' });
    return;
  }

  const { ai, error } = getGeminiClient();

  // If Gemini API Key is missing or invalid, fallback to a highly intelligent rule-based navigation bot
  // so that the website remains completely usable and friendly.
  if (!ai) {
    console.warn(`[API KEY MISSING] Fallback to simulated local Al-Rihla Navigation Bot. Reason: ${error}`);
    const fallbackResponse = generateLocalBotResponse(userMessage, messages || []);
    res.json({
      text: fallbackResponse,
      fallbackMode: true,
      warning: 'Using offline navigation assist. To unlock advanced live reasoning, configure your GEMINI_API_KEY in the Secrets panel.'
    });
    return;
  }

  try {
    const systemPrompt = `You are 'fifa guider', the official AI Stadium & Directions Assistant for the FIFA World Cup.
Your primary role is to help fans navigate inside stadiums (specifically Lusail Stadium and Al Bayt Stadium) and provide updates.

STADIUMS AND RULES DATABASE:
1. LUSAIL STADIUM:
   - Capacity: 88,900.
   - Gates:
     - Gate A (North Entrance): Best for VIP North Block (B101) and Category 2 North Tier (B301).
     - Gate B (East Entrance): Leads to Category 1 East Side (B201). [WARNING] Currently experiencing high congestion! Advise users to enter via Gate C or Gate D instead to avoid lines.
     - Gate C (South Entrance): Best for VIP South Block (B102) and Category 2 South Tier (B302).
     - Gate D (West Entrance): Leads to Category 1 West Side (B202) and Category 3 High Tier (B401).
   - Facilities:
     - Food Court A is adjacent to Gate A (Currently high load/lines).
     - Food Court B is next to Gate B.
     - Restrooms North are close to Block 101 & 301.
     - Restrooms East are closed for regular maintenance. Direct users to North or South Restrooms.
     - Medical Station 1 is near Gate D.
   - Directions:
     - From Block B201 (East) to Restrooms North: Exit Block B201, walk north along the secure outer concourse toward Gate A corridor, restroom entrance is adjacent to VIP lift 2.
     - VIP ticket holders have dedicated fast-track security lanes at Gates A and C.

2. AL BAYT STADIUM:
   - Capacity: 68,890.
   - Gates:
     - Gate 1 (Main Entrance): Leads to Category 1 West Lower (BA02) and Category 3 Family Tier (BA04).
     - Gate 2 (VIP Entrance): Leads to VIP Tent Loge (BA01).
     - Gate 3 (Public East): Leads to Category 2 East Stand (BA03).
   - Facilities:
     - Main Concourse Food Hub is near Gate 1.
     - Restrooms Central are near Gate 2.
     - Gift Shop Area 1 is near Gate 3 (restricted access/authorized ticket holders only).

LIVE TOURNAMENT UPDATE FEED:
- Live Match: Argentina 3-2 France (78th minute, Semifinal at Lusail Stadium). Goals: Argentina - Lionel Messi 12' (P), Julián Álvarez 54', Lautaro Martínez 73'; France - Kylian Mbappé 28', 66'. Highly energetic, tense game!
- Next Match: England vs Brazil (Semifinal 2) scheduled for tomorrow 20:00 AST at Al Bayt Stadium.
- Current Top Scorers: Kylian Mbappé (6 goals), Lionel Messi (5 goals), Erling Haaland (5 goals).

INSTRUCTIONS FOR NAVIGATION RESPONSES:
- Be concise, professional, warm, and highly visual.
- Use step-by-step bullet points for directions.
- If a route involves Gate B (Lusail) or Restrooms East, proactively offer alternative advice (Gate C/D, Restrooms North/South).
- Always speak directly and humbly as a tournament host. Do not make up non-existent gates. Use the facts provided.`;

    // Construct historical messages format for the chat API
    // We can use simple generateContent with a conversational history context.
    const chatHistory = (messages || []).map((m: any) => {
      return `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`;
    }).join('\n');

    const promptText = `${chatHistory}\nUser: ${userMessage}\nAssistant:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({
      text: response.text || "I apologize, I could not generate a response. Is there anything else I can assist you with inside the stadium?",
      fallbackMode: false
    });

  } catch (err: any) {
    console.error('Gemini API call failed, falling back to local reasoning:', err);
    const fallbackResponse = generateLocalBotResponse(userMessage, messages || []);
    res.json({
      text: fallbackResponse,
      fallbackMode: true,
      errorDetails: err?.message || String(err)
    });
  }
});

// Simulated rule-based AI bot when API key is missing
function generateLocalBotResponse(userMsg: string, history: any[]): string {
  const msg = userMsg.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey')) {
    return `Marhaban! I am 'fifa guider', your stadium navigation assistant. 🏟️
    
I can help you navigate inside **Lusail Stadium** and **Al Bayt Stadium**, find your seats, restrooms, medical bays, food courts, or get the latest live World Cup statistics and Crowd Management telemetry. What can I help you find today?`;
  }

  if (msg.includes('crowd') || msg.includes('manage') || msg.includes('flow') || msg.includes('evacuate') || msg.includes('emergency') || msg.includes('safety') || msg.includes('density') || msg.includes('traffic')) {
    return `🏟️ **FIFA Live Crowd Management & Flow Report:**
• **Lusail Stadium Gates Density:** 
  - Gate A: Moderate flow (75% occupancy, wait time ~8 mins).
  - Gate B (East): **HIGHLY CONGESTED** (95% occupancy, wait time ~28 mins). *Recommendation: Divert to Gate C or D.*
  - Gate C: Low flow (30% occupancy, wait time ~3 mins).
  - Gate D: Moderate flow (50% occupancy, wait time ~6 mins).
• **Evacuation Preparedness:** All emergency exit pathways are fully illuminated. Evacuation tests clear the 80,000+ stadium in under 12.5 minutes!
• **Metro Line Transit Queue:** Wait times at Lusail Metro Station (Red Line) is currently 15 minutes. Dispatching extra trains reduces this to under 4 minutes. Enjoy the match and travel safely!`;
  }
  
  if (msg.includes('lusail') || msg.includes('directions') || msg.includes('how to get to') || msg.includes('gate') || msg.includes('block')) {
    let resp = `**Lusail Stadium Navigation Guide:**\n\n`;
    if (msg.includes('vip') || msg.includes('b101') || msg.includes('b102')) {
      resp += `• **VIP Blocks (B101, B102):** Access via **Gate A (North Entrance)** or **Gate C (South Entrance)**. VIP tickets enjoy priority fast-track lanes. Use VIP Elevators 1 or 2 to level 3.\n`;
    }
    if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('bathroom')) {
      resp += `• **Restrooms:** Restrooms North (near Block 101/301) are fully open. *Note:* Restrooms East are closed for maintenance today, please use Restrooms South (near Gate C) as an alternative.\n`;
    }
    if (msg.includes('food') || msg.includes('hungry') || msg.includes('eat') || msg.includes('drink')) {
      resp += `• **Dining:** Food Court A is near Gate A (high load right now). Food Court B is near Gate B and is currently much faster!\n`;
    }
    if (msg.includes('congest') || msg.includes('crowd') || msg.includes('busy') || msg.includes('gate b')) {
      resp += `• **Traffic Warning:** Gate B (East) is experiencing high security congestion. We highly recommend utilizing **Gate C (South)** or **Gate D (West)** instead for immediate entry.\n`;
    }
    if (resp === `**Lusail Stadium Navigation Guide:**\n\n`) {
      resp += `• **Gates & Zones:**\n  - **Gate A (North):** Leads to Block B101 (VIP) & B301 (Cat 2).\n  - **Gate B (East):** Leads to Block B201 (Cat 1) - *Congested!*\n  - **Gate C (South):** Leads to Block B102 (VIP) & B302 (Cat 2).\n  - **Gate D (West):** Leads to Block B202 (Cat 1) & B401 (Cat 3).\n• Exit gates are clearly lit in green. For emergency services, Medical Station 1 is near Gate D.`;
    }
    return resp;
  }

  if (msg.includes('al bayt') || msg.includes('al-bayt') || msg.includes('khor')) {
    return `**Al Bayt Stadium (Al Khor) Navigation Guide:**
• **Gate 1 (Main Entrance):** Leads to Category 1 West Lower (BA02) and Category 3 Family Tier (BA04). Food hub is nearby.
• **Gate 2 (VIP Entrance):** Leads to VIP Tent Loge (BA01) and Central Restrooms.
• **Gate 3 (Public East Entrance):** Leads to Category 2 East Stand (BA03) and Gift Shop.
• *Note:* The roof is currently closed. Air conditioning is set to 21°C inside the bowl. Enjoy the match!`;
  }

  if (msg.includes('score') || msg.includes('live') || msg.includes('match') || msg.includes('argentina') || msg.includes('france') || msg.includes('who is winning')) {
    return `📊 **Live Match Alert:** 
Argentina **3 - 2** France (78' minute, Semifinal at Lusail Stadium)
• **Goals (ARG):** Lionel Messi 12' (P), Julián Álvarez 54', Lautaro Martínez 73'
• **Goals (FRA):** Kylian Mbappé 28', 66'
The match is extremely intense! Next Semifinal is **England vs Brazil** scheduled for tomorrow at 20:00 AST at Al Bayt Stadium.`;
  }

  if (msg.includes('player') || msg.includes('ranking') || msg.includes('top scorer') || msg.includes('messi') || msg.includes('mbappe')) {
    return `⚽ **FIFA World Cup Top Scorers Feed:**
1. **Kylian Mbappé (FRA):** 6 Goals, 3 Assists (Rating: 8.85)
2. **Lionel Messi (ARG):** 5 Goals, 4 Assists (Rating: 8.92)
3. **Erling Haaland (NOR):** 5 Goals, 1 Assist (Rating: 8.42)
4. **Jude Bellingham (ENG):** 3 Goals, 4 Assists (Rating: 8.55)
5. **Bruno Fernandes (POR):** 3 Goals, 3 Assists (Rating: 8.38)`;
  }

  return `I am fifa guider, here to assist with World Cup navigation! I can provide step-by-step directions for Lusail and Al Bayt Stadiums, gate locations, restroom status, and live match scores. Try asking 'Which gate leads to Block 101?' or 'What is the score of Argentina vs France?'`;
}

// 2. VITE MIDDLEWARE SETUP FOR DEV/PROD ENVS

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite in development middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the dist folder in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Redirect all non-API GET requests to index.html for SPA router support
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FIFA World Cup Hub] Express server running on port ${PORT}`);
  });
}

startServer();
