/**
 * AI chat via Groq (llama-3.3-70b-versatile).
 * Exports the same function name so ai.controller.js needs no changes.
 */
const axios    = require('axios');
const settings = require('./settingsService');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a knowledgeable and compassionate spiritual assistant for Zutsav, a Hindu spiritual services platform based in India.

Your role is to help devotees with:
- Pooja recommendations based on their needs (health, prosperity, marriage, protection, etc.)
- Festival and tithi suggestions for auspicious activities
- General FAQ about Hindu rituals and their significance
- Astrology guidance (basic — rashis, graha doshas, shanti poojas)
- Guidance on when to perform which pooja based on occasion
- Explanation of mantras, rituals, and their benefits

Guidelines:
- Respond warmly and respectfully in simple English (mix a little Hindi if appropriate)
- Keep answers concise (max 200 words)
- For medical, legal, or financial matters, gently redirect to professionals
- Do not make claims about guaranteed outcomes — use "is believed to", "traditionally helps with"
- Always end responses with "Jai Shri Ram 🙏" or a similar blessing
- You represent Zutsav — keep a professional, spiritual tone`;

/**
 * Get a response from Groq given a conversation history.
 * @param {Array<{role: 'user'|'model', text: string}>} history
 * @returns {Promise<string>}
 */
const getGeminiResponse = async (history) => {
  const apiKey = await settings.get('groqApiKey', process.env.GROQ_API_KEY);
  const model  = await settings.get('groqModel',  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');

  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role:    m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const { data } = await axios.post(
    GROQ_URL,
    {
      model,
      messages,
      temperature: 0.7,
      max_tokens:  512,
    },
    {
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text;
};

module.exports = { getGeminiResponse };
