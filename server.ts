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
      model: 'gemini-2.5-flash',
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
  const msg = userMsg.toLowerCase().trim();
  
  // 1. GREETINGS & INTROS
  if (msg.includes('hello') || msg.includes('hi ') || msg === 'hi' || msg.includes('hey') || msg.includes('marhaban') || msg.includes('greetings')) {
    return `Marhaban! I am **'fifa guider'**, your stadium navigation and World Cup assistant. 🏟️
    
I can guide you step-by-step through **Lusail Stadium** and **Al Bayt Stadium**, help you locate amenities (like restrooms, dining options, medical stations), check live match stats, or monitor crowd flow.

How can I assist you with your tournament experience today?`;
  }

  // 2. THANKS & POLITE CLOSURES
  if (msg.includes('thank') || msg === 'ok' || msg === 'okay' || msg.includes('thanks') || msg === 'great' || msg === 'awesome' || msg.includes('perfect')) {
    return `You are very welcome! It is an honor to assist you. 😊 

Let me know if you need any other directions or live updates. Enjoy the world-class action at the tournament!`;
  }

  // 3. CAPABILITIES / HELP
  if (msg.includes('help') || msg.includes('capability') || msg.includes('what can you do') || msg.includes('options') || msg.includes('who are you')) {
    return `I am your digital host and navigation assistant! Here are some things you can ask me:
    
• 🗺️ **Directions:** *"How do I get to VIP Block B101?"* or *"Where is Gate 1 at Al Bayt?"*
• 🚻 **Amenities:** *"Where is the nearest restroom?"* or *"Is there a medical bay?"*
• 🍔 **Food & Drinks:** *"Where can I eat near Gate B?"* or *"Food court locations"*
• 📊 **Live Match Status:** *"What is the score of Argentina vs France?"*
• ⚽ **Tournament Stats:** *"Who are the top scorers?"*
• 🚇 **Transit & Traffic:** *"Which gates are congested?"* or *"Lusail Metro wait times"*

What would you like to explore first?`;
  }

  // 4. RESTROOMS / TOILETS
  if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('bathroom') || msg.includes('wc') || msg.includes('washroom') || msg.includes('lavatory')) {
    const isAlBayt = msg.includes('bayt') || msg.includes('khor');
    if (isAlBayt) {
      return `🚻 **Al Bayt Stadium Restroom Guide:**
• **Central Restrooms:** Located directly off the main concourse near **Gate 2 (VIP Entrance)**.
• **East & West Wings:** General public restrooms are spaced every 50 meters along the lower concourse, fully accessible with baby-changing facilities. All systems are operating normally.`;
    }
    
    // Default or Lusail restroom guidance
    return `🚻 **Lusail Stadium Restroom Guide:**
• **Restrooms North (Near Blocks B101 / B301):** Fully open and operating with low queues.
• **Restrooms South (Near Gate C):** Fully open and a great alternative.
• ⚠️ **Restrooms East (Near Gate B):** Currently **CLOSED for regular maintenance**. If you are seated in Block B201, please head North toward Gate A corridor where the restrooms are fully open.`;
  }

  // 5. FOOD / DRINKS / EATING / CONCESSIONS
  if (msg.includes('food') || msg.includes('eat') || msg.includes('drink') || msg.includes('hungry') || msg.includes('thirsty') || msg.includes('concession') || msg.includes('dining') || msg.includes('restaurant') || msg.includes('cafe')) {
    const isAlBayt = msg.includes('bayt') || msg.includes('khor');
    if (isAlBayt) {
      return `🍔 **Al Bayt Stadium Concessions & Dining:**
• **Main Concourse Food Hub:** Located directly near **Gate 1 (Main Entrance)**. Serving traditional Qatari bites, burgers, wraps, and cold beverages.
• **Premium Lounges:** VIP guests entering via Gate 2 have direct access to the luxury tent dining halls. All kiosks accept contactless digital payments.`;
    }

    return `🍔 **Lusail Stadium Concessions & Dining:**
• **Food Court A (Near Gate A):** Currently experiencing high loads and wait times (~15 mins).
• **Food Court B (Near Gate B/C):** Operating smoothly with fast service. Highly recommended if you are hungry!
• **Local kiosks:** Placed around all exit channels. Contactless payment and digital ordering are available.`;
  }

  // 6. MEDICAL / CLINIC / FIRST AID
  if (msg.includes('medical') || msg.includes('doctor') || msg.includes('injury') || msg.includes('first aid') || msg.includes('hospital') || msg.includes('clinic') || msg.includes('sick') || msg.includes('hurt') || msg.includes('paramedic')) {
    return `🚑 **Emergency & Medical Services:**
• **Lusail Stadium:** **Medical Station 1** is fully staffed and located adjacent to the concourse near **Gate D (West Entrance)**.
• **Al Bayt Stadium:** First aid responders are stationed at **Gate 1** and **Gate 3**.
• **In emergencies:** Please flag any steward in a bright orange vest immediately. They are radio-connected directly to our paramedic dispatch hub.`;
  }

  // 7. VIP / PREMIUM SEATING
  if (msg.includes('vip') || msg.includes('suite') || msg.includes('premium') || msg.includes('hospitality') || msg.includes('lounge')) {
    const isAlBayt = msg.includes('bayt') || msg.includes('khor');
    if (isAlBayt) {
      return `👑 **Al Bayt VIP Hospitality:**
• **Gate 2 (VIP Entrance):** Dedicated fast-track entrance leading to the spectacular traditional tent VIP lounges and private loges (Block BA01).
• **Valet & Chauffeur Dropoff:** Available directly at the outer cordon of Gate 2.`;
    }
    return `👑 **Lusail Stadium VIP Hospitality:**
• **VIP Blocks (B101 & B102):** Access via **Gate A (North)** or **Gate C (South)**. Use VIP Elevators 1 & 2 to level 3.
• **Fast Track Security:** VIP ticket holders bypass public queues at Gates A and C. Gourmet catering is active inside the golden lounge corridors.`;
  }

  // 8. CROWD / GATES / TRAFFIC / SECURITY
  if (msg.includes('crowd') || msg.includes('manage') || msg.includes('flow') || msg.includes('evacuate') || msg.includes('emergency') || msg.includes('safety') || msg.includes('density') || msg.includes('traffic') || msg.includes('congest') || msg.includes('line') || msg.includes('queue') || msg.includes('wait')) {
    const isAlBayt = msg.includes('bayt') || msg.includes('khor');
    if (isAlBayt) {
      return `🏟️ **Al Bayt Crowd & Transit Telemetry:**
• **Gate 1 (Main):** Moderate crowd density (wait time ~10 mins).
• **Gate 3 (East):** Low density (wait time ~4 mins).
• **Retractable Roof:** Closed. Temperature inside is regulated at a pleasant 21°C.
• **Shuttle Buses:** Buses to Al Khor transit hub are departing every 2 minutes. Egress is highly fluid.`;
    }

    return `🏟️ **Lusail Live Crowd Management & Flow Report:**
• **Lusail Stadium Gates Density:** 
  - **Gate A (North):** Moderate flow (75% occupancy, wait time ~8 mins).
  - **Gate B (East):** ⚠️ **HIGHLY CONGESTED** (95% occupancy, wait time ~28 mins). *Recommendation: Divert to Gate C or D.*
  - **Gate C (South):** Low flow (30% occupancy, wait time ~3 mins).
  - **Gate D (West):** Moderate flow (50% occupancy, wait time ~6 mins).
• **Evacuation Preparedness:** All emergency exit pathways are fully illuminated. Evacuation tests clear the 80,000+ stadium in under 12.5 minutes!
• **Metro Line Transit Queue:** Wait times at Lusail Metro Station (Red Line) is currently 15 minutes. Dispatching extra trains reduces this to under 4 minutes. Enjoy the match and travel safely!`;
  }

  // 9. DIRECTIONS / BLOCKS / STADIUM NAVIGATION SPECIFICS
  if (msg.includes('directions') || msg.includes('how to get') || msg.includes('how do i get') || msg.includes('where is') || msg.includes('block') || msg.includes('gate') || msg.includes('seat')) {
    const isAlBayt = msg.includes('bayt') || msg.includes('khor') || msg.includes('ba01') || msg.includes('ba02') || msg.includes('ba03') || msg.includes('ba04');
    
    if (isAlBayt) {
      let resp = `🗺️ **Al Bayt Stadium Navigation Guide:**\n\n`;
      if (msg.includes('ba01') || msg.includes('vip')) {
        resp += `• **VIP Block BA01:** Enter via **Gate 2 (VIP Entrance)**, proceed straight past the traditional nomad exhibition, use Lift A to Level 1 VIP concourse.\n`;
      }
      if (msg.includes('ba02') || msg.includes('cat 1') || msg.includes('category 1')) {
        resp += `• **Block BA02 (Cat 1 West Lower):** Enter via **Gate 1 (Main Entrance)**, turn left and follow the indicators to Section BA02.\n`;
      }
      if (msg.includes('ba03') || msg.includes('cat 2') || msg.includes('category 2')) {
        resp += `• **Block BA03 (Cat 2 East Stand):** Enter via **Gate 3 (Public East)**, turn right and locate Staircase E.\n`;
      }
      if (msg.includes('ba04') || msg.includes('family') || msg.includes('cat 3') || msg.includes('category 3')) {
        resp += `• **Block BA04 (Cat 3 Family Tier):** Enter via **Gate 1 (Main Entrance)**, follow green signs up to Level 2 Family Concourse.\n`;
      }
      if (resp === `🗺️ **Al Bayt Stadium Navigation Guide:**\n\n`) {
        resp += `• **Gates:**\n  - **Gate 1 (Main):** Best for Blocks BA02 (Cat 1) & BA04 (Cat 3 Family).\n  - **Gate 2 (VIP):** Direct access for Block BA01 VIP Suites.\n  - **Gate 3 (East):** Direct access for Block BA03 (Cat 2).\n• Follow color-coded floor lines: Green for Family, Gold for VIP, Blue for General Admissions.`;
      }
      return resp;
    }

    // Default to Lusail Stadium Directions
    let resp = `🗺️ **Lusail Stadium Navigation Guide:**\n\n`;
    if (msg.includes('b101') || msg.includes('vip north')) {
      resp += `• **Block B101 (VIP North):** Access via **Gate A (North Entrance)**. Take VIP Lift 1 to Level 3. Your seat is highlighted in our live Interactive Map!\n`;
    }
    if (msg.includes('b102') || msg.includes('vip south')) {
      resp += `• **Block B102 (VIP South):** Access via **Gate C (South Entrance)**. Take VIP Lift 2 to Level 3. Your seat is highlighted in our live Interactive Map!\n`;
    }
    if (msg.includes('b201') || msg.includes('cat 1 east')) {
      resp += `• **Block B201 (Cat 1 East):** Access via **Gate B (East Entrance)** or **Gate C (South)**. *Tip:* Gate B is highly congested; enter via Gate C, turn right and walk the lower concourse.\n`;
    }
    if (msg.includes('b202') || msg.includes('cat 1 west')) {
      resp += `• **Block B202 (Cat 1 West):** Access via **Gate D (West Entrance)**. Take Staircase W3.\n`;
    }
    if (msg.includes('b301') || msg.includes('cat 2 north')) {
      resp += `• **Block B301 (Cat 2 North):** Access via **Gate A (North Entrance)**. Take Staircase N1 to Upper Concourse Level 2.\n`;
    }
    if (msg.includes('b302') || msg.includes('cat 2 south')) {
      resp += `• **Block B302 (Cat 2 South):** Access via **Gate C (South Entrance)**. Take Staircase S1 to Upper Concourse Level 2.\n`;
    }
    if (msg.includes('b401') || msg.includes('cat 3 high')) {
      resp += `• **Block B401 (Cat 3 High):** Access via **Gate D (West Entrance)**. Take Lift 4 to Level 4 (highest level).\n`;
    }
    if (resp === `🗺️ **Lusail Stadium Navigation Guide:**\n\n`) {
      resp += `• **Recommended Gates:**\n  - **Gate A (North):** Best for Block B101 (VIP) & B301 (Cat 2).\n  - **Gate B (East):** Leads to Block B201 (Cat 1) - *Highly congested today!*\n  - **Gate C (South):** Best for Block B102 (VIP) & B302 (Cat 2).\n  - **Gate D (West):** Leads to Block B202 (Cat 1) & B401 (Cat 3).\n• Please look at our **Interactive Stadium Map** tab. You can click on any seat block to see exact routes and details instantly!`;
    }
    return resp;
  }

  // 10. LUSAIL GENERAL
  if (msg.includes('lusail') || msg.includes('golden bowl')) {
    return `🏟️ **Lusail Iconic Stadium (Golden Bowl):**
• **Capacity:** 88,900.
• **Acoustics & Air:** Features state-of-the-art under-seat micro-cooling nozzles set to 21°C.
• **Gates:** Gate A (North), Gate B (East - ⚠️ Congested), Gate C (South), Gate D (West).
• **Live Match:** Currently hosting the Argentina vs France Semifinal!
• *Check out the seating blocks in the **Stadium Map** tab or ask me: "How do I get to Block B101?"*`;
  }

  // 11. AL BAYT GENERAL
  if (msg.includes('al bayt') || msg.includes('al-bayt') || msg.includes('khor') || msg.includes('tent')) {
    return `🏟️ **Al Bayt Stadium (Al Khor):**
• **Capacity:** 68,890.
• **Design:** Styled after traditional 'Bayt al sha'ar' black-and-white tents used by nomadic peoples in Qatar.
• **Gates:** Gate 1 (Main West), Gate 2 (VIP), Gate 3 (Public East).
• **Upcoming Match:** England vs Brazil Semifinal scheduled for tomorrow 20:00 AST.
• *Check out the seating blocks in the **Stadium Map** tab or ask me: "How do I get to BA02?"*`;
  }

  // 12. MATCH SCORE & UPDATES
  if (msg.includes('score') || msg.includes('live') || msg.includes('match') || msg.includes('argentina') || msg.includes('france') || msg.includes('who is winning') || msg.includes('who is playing') || msg.includes('semifinal')) {
    return `📊 **Live FIFA Semifinal Match Feed:** 
⚽ **Argentina 3 - 2 France** (78' minute, playing live at Lusail Stadium)
• **Goals (ARG):** Lionel Messi 12' (P), Julián Álvarez 54', Lautaro Martínez 73'
• **Goals (FRA):** Kylian Mbappé 28', 66'

*Next Semifinal:* **England vs Brazil** is scheduled for tomorrow at 20:00 AST at Al Bayt Stadium.
*How to check stats:* Check the **Live Tournament Stats & Feed** dashboard tab for full player performance matrices and live charts!`;
  }

  // 13. PLAYERS & STATS
  if (msg.includes('player') || msg.includes('ranking') || msg.includes('top scorer') || msg.includes('messi') || msg.includes('mbappe') || msg.includes('haaland') || msg.includes('bellingham') || msg.includes('stats')) {
    return `⚽ **FIFA Tournament Top Scorers & Performance:**
1. 🏅 **Kylian Mbappé (FRA):** 6 Goals, 3 Assists (Rating: 8.85)
2. 🥈 **Lionel Messi (ARG):** 5 Goals, 4 Assists (Rating: 8.92)
3. 🥉 **Erling Haaland (NOR):** 5 Goals, 1 Assist (Rating: 8.42)
4. 👤 **Jude Bellingham (ENG):** 3 Goals, 4 Assists (Rating: 8.55)
5. 👤 **Bruno Fernandes (POR):** 3 Goals, 3 Assists (Rating: 8.38)

*Interactive View:* You can check out complete heatmaps and individual metrics in our **Live Tournament Stats & Feed** tab!`;
  }

  // 14. DEFAULT SMART RESPONSE
  return `I am **fifa guider**, here to assist with World Cup navigation! I can provide specific details about:
  
• 🗺️ **Gate and block directions** for Lusail (B101, B201, B301, B401) and Al Bayt (BA01, BA02, BA03, BA04).
• 🚻 **Restroom conditions** (e.g., East restrooms closure at Lusail).
• 🍔 **Food and dining hubs** near specific gates.
• 📊 **Live scores** (Argentina vs France) and player stats.
• 🚇 **Crowd management** and transit station wait times.

Try asking something like: *"How do I get to VIP Block B101?"* or *"Where is the nearest restroom at Lusail?"*`;
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
