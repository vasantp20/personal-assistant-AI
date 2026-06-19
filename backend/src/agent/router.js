const { Groq } = require('groq-sdk');
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

/**
 * Fast classification gateway to route the interaction to the correct sub-domain skill.
 */
async function classifyIntent(prompt) {
  try {
    const groqInstance = getGroq();
    const response = await groqInstance.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a high-speed routing coordinator. Classify the user's input into exactly one of these domains:
- "EXPENSE": For anything related to budgeting, viewing categories, changing limits, logging expenses, or financial history.
- "BOOKING": For purchasing, viewing, or handling train or bus tickets/travel.
- "CAR_TRACKER": For setting up alerts, scanning used cars, scraping Spinny, or checking car notification status.
- "GENERAL": Default fallback if it doesn't clearly match travel booking or expense logging.

Respond with a raw JSON object only. Formula: { "domain": "EXPENSE" | "BOOKING" | "CAR_TRACKER" |"GENERAL" }`
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.domain || 'GENERAL';
  } catch (error) {
    console.error('[ROUTER ERROR] Failed classifying intent, defaulting to GENERAL:', error);
    return 'GENERAL';
  }
}

module.exports = { classifyIntent };