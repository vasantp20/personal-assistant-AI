const puppeteer = require('puppeteer');
const { Groq } = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// Temporary tracking state
let seenCarsCache = [];

// Helper function to replace the removed page.waitForTimeout
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeWithLLMParser(userId) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('[LLM-SCRAPER] Navigating to Spinny...');
    await page.goto('https://www.spinny.com/used-cars-in-bangalore/s/?filterObject={%22max_price%22:[%221000000%22],%22min_price%22:[%22350000%22],%22model%22:[%22br-v%22,%22creta%22,%22duster%22,%22ecosport%22,%22pajero-sport%22,%22venue-nline%22,%22wr-v%22]}', { 
      waitUntil: 'networkidle2', 
      timeout: 45000 
    });

    // FIX 1: Replaced page.waitForTimeout(5000) with local delay utility function
    await delay(5000); 

    // Extract the innerText of the main body
    const pageTextContent = await page.evaluate(() => document.body.innerText);

    // Truncate text context safely
    const optimizedContent = pageTextContent.slice(0, 40000); 

    console.log('[LLM-SCRAPER] Feeding raw page data into Groq for parsing...');
    
    const groqInstance = getGroq();
    const parseResponse = await groqInstance.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `You are a data extraction pipeline. Analyze the provided unstructured text content from a used car marketplace website and extract all visible car listings.
          
          For each car, find:
          - Brand/Model name
          - Year of manufacture
          - Price (as a raw number)
          - Fuel type
          - KM driven
          
          Respond ONLY with a valid JSON object matching this schema:
          {
            "cars": [
              { "title": "Maruti Suzuki Swift", "year": 2019, "price": 540000, "fuel": "Petrol", "km": "42,000 km" }
            ]
          }`
        },
        { role: 'user', content: optimizedContent }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0
    });

    const parsedData = JSON.parse(parseResponse.choices[0].message.content);
    const extractedCars = parsedData.cars || [];
    console.log(`[LLM-SCRAPER] Groq successfully extracted ${extractedCars.length} cars.`);

    const newMatches = [];
    for (const car of extractedCars) {
      if (car.price <= 700000 && !seenCarsCache.includes(car.title + car.price)) {
        newMatches.push(car);
        seenCarsCache.push(car.title + car.price); 
      }
    }

    if (newMatches.length === 0) {
      return { status: 'success', message: 'Scan finished. No new car deals matched your preferences.' };
    }

    return {
      status: 'success',
      message: `Successfully processed listings via Groq! Identified ${newMatches.length} new matches.`
    };

  } catch (error) {
    console.error('[LLM-SCRAPER ERROR] Pipeline broken:', error);
    // Return a clean text object so that your orchestrator handles the error gracefully 
    // instead of crashing completely out of the conversation.
    return { status: 'error', message: `LLM Scraper runtime failed: ${error.message}` };
  } finally {
    await browser.close();
  }
}

async function executeCarTrackerTool(userId, name, args) {
  switch (name) {
    case 'checkNewCarsNow':
      return await scrapeWithLLMParser(userId);
    default:
      throw new Error(`Unknown tool action target: ${name}`);
  }
}

module.exports = { executeCarTrackerTool };