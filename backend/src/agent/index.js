const { Readable } = require('stream');
const { Groq } = require('groq-sdk');
const Message = require('../models/Message');

// Domain Modules
const { classifyIntent } = require('./router');
const { buildExpensePrompt } = require('./domains/expense/prompt');
const expenseTools = require('./domains/expense/tools');
const { executeExpenseTool } = require('./domains/expense/actions');

const { buildBookingPrompt } = require('./domains/booking/prompt');
const bookingTools = require('./domains/booking/tools');
const { executeBookingTool } = require('./domains/booking/actions');

const { buildCarTrackerPrompt } = require('./domains/carfinder/prompt');
const carTrackerTools = require('./domains/carfinder/tools');
const { executeCarTrackerTool } = require('./domains/carfinder/actions');

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const AGENT_PROVIDER = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

const logger = {
  info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, err = '') => console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`, err.stack || err || '')
};

function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function streamGroqToSSE(messages, res, tools = null) {
  logger.info(`Streaming Groq model: ${GROQ_MODEL}`);
  
  // Clean up arguments explicitly to prevent tool choice streaming collision errors
  const hasTools = Array.isArray(tools) && tools.length > 0;

  const stream = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages,
    tools: hasTools ? tools : undefined,
    tool_choice: hasTools ? 'auto' : undefined,
    stream: true,
  });

  const toolCalls = {};
  let accumulatedText = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      accumulatedText += delta.content;
      writeSSE(res, 'content', { delta: delta.content });
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolCalls[idx]) {
          toolCalls[idx] = { id: '', type: 'function', function: { name: '', arguments: '' } };
        }
        if (tc.id) toolCalls[idx].id = tc.id;
        if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
        if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
      }
    }
  }

  // Ensure tool calls are extracted correctly by checking if they gathered function names
  const calls = Object.values(toolCalls).filter((tc) => tc.id || tc.function?.name);
  return { toolCalls: calls.length ? calls : null, textResponse: accumulatedText || null };
}

exports.talk = async (req, res, next) => {
  console.log("New router")
  const userId = req.user._id;
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required', code: 'VALIDATION_ERROR' });

    if (AGENT_PROVIDER === 'ollama') {
      return streamOllama(prompt, res); 
    }

    // 1. Instantly establish the communication route
    initSSE(res);

    // 2. Classify intent via routing gate
    const domain = await classifyIntent(prompt);
    logger.info(`Routed transaction request path execution to context target: ${domain}`);

    // 3. Select systemic items isolated to active domain requirements
    let systemPrompt = '';
    let activeTools = null;
    let executeActionHandler = null;

    if (domain === 'EXPENSE') {
      systemPrompt = await buildExpensePrompt(userId);
      activeTools = expenseTools;
      executeActionHandler = executeExpenseTool;
    } else if (domain === 'BOOKING') {
      systemPrompt = await buildBookingPrompt(userId);
      activeTools = bookingTools;
      executeActionHandler = executeBookingTool;
    } else if (domain === 'CAR_TRACKER') {
      systemPrompt = await buildCarTrackerPrompt(userId);
      activeTools = carTrackerTools;
      executeActionHandler = executeCarTrackerTool;
    } else {
      systemPrompt = 'You are a helpful general assistant. Keep answers practical and concise.';
    }

    // 4. Handle history loading optimization
    const historicalMessages = await Message.find({ user_id: userId }).sort({ createdAt: -1 }).limit(15);
    historicalMessages.reverse();

    await Message.create({ user_id: userId, role: 'user', content: prompt });

    const formattedHistory = historicalMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      ...(msg.name && { name: msg.name }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls })
    }));
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: prompt }
    ];

    // 5. Execute Run Sequence loop via dynamic bindings
    const { toolCalls, textResponse: plainTextResponse } = await streamGroqToSSE(messages, res, activeTools);

    if (toolCalls?.length) {
      const toolCall = toolCalls[0];
      let args = JSON.parse(toolCall.function.arguments || '{}');
      
      writeSSE(res, 'tool_call', { name: toolCall.function.name, args });
      await Message.create({ user_id: userId, role: 'assistant', content: null, tool_calls: toolCalls });

      let stringifiedResult;
      try {
        const localResult = await executeActionHandler(userId, toolCall.function.name, args);
        stringifiedResult = JSON.stringify(localResult);
      } catch (toolError) {
        stringifiedResult = JSON.stringify({ error: toolError.message });
      }

      writeSSE(res, 'tool_result', { name: toolCall.function.name, content: JSON.parse(stringifiedResult) });
      await Message.create({ user_id: userId, role: 'tool', tool_call_id: toolCall.id || 'call_fallback', name: toolCall.function.name, content: stringifiedResult });

      messages.push({ role: 'assistant', content: null, tool_calls: toolCalls });
      messages.push({ role: 'tool', tool_call_id: toolCall.id || 'call_fallback', name: toolCall.function.name, content: stringifiedResult });

      const { textResponse: finalTextResponse } = await streamGroqToSSE(messages, res, null);
      if (finalTextResponse) {
        await Message.create({ user_id: userId, role: 'assistant', content: finalTextResponse });
      }
    } else if (plainTextResponse) {
      await Message.create({ user_id: userId, role: 'assistant', content: plainTextResponse });
    }

    writeSSE(res, 'done', {});
    res.end();
  } catch (err) {
    logger.error(`Fatal crash caught inside central orchestrator wrapper loop.`, err);
    if (!res.headersSent) return next(err);
    writeSSE(res, 'error', { message: err.message });
    res.end();
  }
};

// Simple legacy wrapper for Ollama execution loop compatibility
async function streamOllama(prompt, res) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true }),
  });
  if (!response.ok) return res.status(response.status).json({ error: 'Ollama failed' });
  initSSE(res);
  Readable.fromWeb(response.body).on('data', (chunk) => {
    const parsed = JSON.parse(chunk.toString().trim() || '{}');
    if (parsed.response) writeSSE(res, 'content', { delta: parsed.response });
    if (parsed.done) writeSSE(res, 'done', {});
  }).on('end', () => res.end());
}

exports.getHistory = async (req, res, next) => {
  try {
    const history = await Message.find({ user_id: req.user._id }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve message logs.' });
  }
};

exports.agentHealth = async (req, res, next) => {
  res.json({ status: 'ok', provider: AGENT_PROVIDER, timestamp: new Date().toISOString() });
};