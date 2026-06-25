import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Initialize GoogleGenAI lazily to avoid crashes if API key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not defined or is placeholder. AI actions will run in high-quality Simulation Mode.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 1. AI Auction Appraisal Endpoint
app.post('/api/ai/appraise', async (req, res) => {
  const { title, description, category, currentBid, startingBid } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required for appraisal.' });
    return;
  }

  const client = getAiClient();

  if (!client) {
    // Elegant simulation fallback for sandbox environments when API Key isn't loaded
    const simulatedAppraisal = generateSimulatedAppraisal(title, category, startingBid, currentBid);
    res.json({
      ...simulatedAppraisal,
      isSimulation: true,
      notice: 'Running in developer simulation. Configure your GEMINI_API_KEY in Secrets for real AI appraisals!'
    });
    return;
  }

  try {
    const prompt = `You are an elite professional numismatist, currency appraiser, and historical coin auction strategist.
Analyze the following numismatic or currency item currently up for live auction:
Title: "${title}"
Category: "${category}"
Starting Bid: $${startingBid || 0}
Current Bid: $${currentBid || startingBid || 0}
Description: "${description || 'No description provided.'}"

Generate an expert, detailed numismatic appraisal and bidding strategy in valid, parseable JSON format. Do not add markdown wrapping like \`\`\`json unless required. Ensure your response matches this TypeScript interface EXACTLY:
{
  "estimatedValue": number (estimated fair market value in USD),
  "demandRating": "High" | "Medium" | "Low",
  "buyersStrategy": "string (practical strategy for coin bidders, e.g. checking certified grading PCGS/NGC, timing bids, market demand)",
  "sellersStrategy": "string (advice for the numismatic seller, e.g. highlighting slab certification, storage conditions, provenance, historical relevance)",
  "verdict": "string (compelling 3-4 sentence historical and professional evaluation of the coin or banknote's design, rarity, metal composition, and long-term numismatic appreciation)"
}

Return ONLY the raw JSON object, no extra text.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || '';
    
    // Clean code blocks if returned
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }
    
    const parsedData = JSON.parse(text.trim());
    res.json({ ...parsedData, isSimulation: false });
  } catch (error: any) {
    console.error('Gemini Appraisal Error:', error);
    // Graceful fallback on API error
    const simulatedAppraisal = generateSimulatedAppraisal(title, category, startingBid, currentBid);
    res.json({
      ...simulatedAppraisal,
      isSimulation: true,
      error: error.message || 'Error occurred during AI generation'
    });
  }
});

// 2. AI Auction Description Generator Endpoint
app.post('/api/ai/generate-description', async (req, res) => {
  const { title, category, keyDetails } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required to generate description.' });
    return;
  }

  const client = getAiClient();

  if (!client) {
    const simulatedDescription = `This is a premium ${category || 'general'} item: "${title}".
- Handpicked premium selection.
- Features: ${keyDetails || 'Excellent condition, highly collectible.'}
- Fully verified by our luxury appraisers.
- Perfect for collectors and enthusiasts looking for style and exceptional durability.`;
    res.json({
      description: simulatedDescription,
      isSimulation: true,
      notice: 'Running in simulation mode. Set GEMINI_API_KEY in Secrets for stunning professional copy!'
    });
    return;
  }

  try {
    const prompt = `You are a high-end copywriter specializing in luxury auctions, art catalogs, and premium ecommerce listings.
Create a captivating, professional, and persuasive auction description for the following item:
Title: "${title}"
Category: "${category || 'General'}"
Key Specs/Bullet Points: "${keyDetails || 'Pristine, well-maintained'}"

Format it as a clean, engaging narrative followed by 4 bulleted key selling features. Make it sound sophisticated and urgent. Avoid emojis. Make it around 150-200 words.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      description: response.text || 'Unable to generate description.',
      isSimulation: false
    });
  } catch (error: any) {
    console.error('Gemini Description Error:', error);
    res.json({
      description: `Premium listing for "${title}".\n\nKey features include:\n- ${keyDetails || 'Excellent condition.'}\n- Authenticity certified.\n- Shipped securely with insurance.`,
      isSimulation: true,
      error: error.message || 'Error generating description.'
    });
  }
});

// Helper for simulated appraisals
function generateSimulatedAppraisal(title: string, category: string, startingBid: number, currentBid: number) {
  const basePrice = currentBid || startingBid || 100;
  const estimatedValue = Math.round(basePrice * 1.35);
  
  let demandRating: 'High' | 'Medium' | 'Low' = 'Medium';
  if (basePrice > 5000) demandRating = 'High';
  else if (basePrice < 300) demandRating = 'Low';

  let buyersStrategy = '';
  let sellersStrategy = '';
  let verdict = '';

  if (category === 'Ancient') {
    buyersStrategy = 'Ancient classical issues command significant premiums based on physical state (strike/surface). We recommend verifying the strike quality (e.g., 5/5) and waiting until late bidding to avoid driving up the hammer price early.';
    sellersStrategy = 'Highlight any historical connection to specific rulers, hoards, or classical battles. High-resolution lighting showing the coin edge and patina contour is critical for ancient collectors.';
    verdict = `The ${title} is an extraordinary survivor of the ancient world. With rich classical iconography and a high level of artistic detail, ancient specimens of this caliber offer immense historical significance and serve as exceptionally robust stores of alternative wealth.`;
  } else if (category === 'Gold & Silver') {
    buyersStrategy = 'Precious metal numismatics derive value from both melt weight and numismatic rarity. Keep an eye on live gold/silver spot prices, and look for slabbed coins graded MS63 or higher to ensure liquidity.';
    sellersStrategy = 'Ensure you clearly list the exact Troy weight, purity, and certification registry number (PCGS/NGC) to attract serious precious-metal investors and high-grade collectors.';
    verdict = `This high-grade precious metal item (${title}) serves as a premier asset bridging the gap between raw bullion security and numismatic collectible appreciation. Highly resilient to monetary inflation, its long-term value retention is historically exceptional.`;
  } else if (category === 'Banknotes') {
    buyersStrategy = 'Paper currency condition is extremely fragile and sensitive. Study the PMG grade (look for "EPQ" or Exceptional Paper Quality). Place conservative early bids but be prepared to act fast in the final seconds for rare signatures.';
    sellersStrategy = 'Ensure the banknote is stored in an archival-grade, acid-free protective sleeve. Highlight the signature varieties, serial number prefixes (like Low Serial or Stars), and paper crispness.';
    verdict = `This rare historical paper currency (${title}) is a highly sought-after piece of statecraft and financial history. Due to the rapid destruction of paper notes over time, surviving examples in high-grade conditions are exceptionally scarce, guaranteeing excellent value appreciation.`;
  } else {
    buyersStrategy = 'Study the current population reports from grading agencies. Ensure any modern proofs or error coins are in sealed certified holder/slabs to protect their high-grade modern finishes.';
    sellersStrategy = 'Provide macro-focused closeups of the coin surface, highlighting proof-like luster or specific error strike shifts. Emphasize limited mintage numbers or certified population scarcity.';
    verdict = `This special numismatic item (${title}) exhibits pristine strike qualities or fascinating mint errors that set it apart from standard issues. Its scarcity among modern or specialty collectors creates a dedicated base of demand, supporting steady appreciation over time.`;
  }

  return {
    estimatedValue,
    demandRating,
    buyersStrategy,
    sellersStrategy,
    verdict
  };
}

// 3. Vite Server Integration Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server connected as Express middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build files from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
