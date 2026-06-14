const { Readable } = require('stream');
const { Groq } = require('groq-sdk');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

const AGENT_PROVIDER = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// Simple internal logger helper for consistent formatting
const logger = {
  info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, err = '') => console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`, err.stack || err || '')
};

const tools = [
  {
    type: 'function',
    function: {
      name: 'logExpense',
      description: 'Logs a new financial expense for the authenticated user under a specific category.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The absolute numeric amount spent.' },
          categoryId: { type: 'string', description: 'The MongoDB ObjectId string of the target category.' },
          description: { type: 'string', description: 'Optional description of what the expense was for.' },
          date: { type: 'string', description: 'Optional ISO string or date format. Defaults to today if not provided.' }
        },
        required: ['amount', 'categoryId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createCategory',
      description: 'Creates a unique budget category with a monthly spending limit for the authenticated user.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the category (e.g., Food, Rent, Utilities).' },
          description: { type: 'string', description: 'Optional description outlining what falls into this category.' },
          monthlyLimit: { type: 'number', description: 'The maximum monthly budget allowed for this category.' }
        },
        required: ['name', 'monthlyLimit']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'viewAllCategories',
      description: 'Retrieves all spending categories belonging exclusively to the authenticated user.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'modifyMonthlyLimitForCategory',
      description: 'Updates the monthly budget limit constraint for a specific category.',
      parameters: {
        type: 'object',
        properties: {
          categoryId: { type: 'string', description: 'The MongoDB ObjectId string of the category to update.' },
          newLimit: { type: 'number', description: 'The new numeric value for the monthly budget cap.' }
        },
        required: ['categoryId', 'newLimit']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getExpensesInTimeRange',
      description: 'Fetches all logged expenses for the authenticated user within a specific timeline window.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'The starting bounding date (e.g., YYYY-MM-DD).' },
          endDate: { type: 'string', description: 'The ending bounding date inclusive (e.g., YYYY-MM-DD).' }
        },
        required: ['startDate', 'endDate']
      }
    }
  }
];

function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function logExpense(userId, amount, categoryId, description, date) {
  logger.info(`Database execution: logExpense called for User: ${userId}`);
  const categoryExists = await Category.findOne({ _id: categoryId, user_id: userId });
  if (!categoryExists) {
    throw new Error('Invalid category or category does not belong to this user.');
  }

  const expense = new Expense({
    user_id: userId,
    category: categoryId,
    amount,
    description,
    date: date || new Date()
  });

  await expense.save();
  logger.info(`Successfully saved expense document ID: ${expense._id}`);
  return expense;
}

async function createCategory(userId, name, description, monthlyLimit) {
  logger.info(`Database execution: createCategory "${name}" called for User: ${userId}`);
  try {
    const category = new Category({
      user_id: userId,
      name,
      description,
      monthly_limit: monthlyLimit
    });

    await category.save();
    logger.info(`Successfully saved category document ID: ${category._id}`);
    return category;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`A category named "${name}" already exists for this user.`);
    }
    throw error;
  }
}

async function viewAllCategories(userId) {
  logger.info(`Database execution: viewAllCategories querying for User: ${userId}`);
  return await Category.find({ user_id: userId });
}

async function modifyMonthlyLimitForCategory(userId, categoryId, newLimit) {
  logger.info(`Database execution: modifyMonthlyLimitForCategory ID: ${categoryId} to limit: ${newLimit} for User: ${userId}`);
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, user_id: userId },
    { monthly_limit: newLimit },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new Error('Category not found or does not belong to this user.');
  }
  logger.info(`Successfully updated category limit config.`);
  return category;
}

const mongoose = require('mongoose');

async function getExpensesInTimeRange(userId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return await Expense.find({
    // Ensures both string and ObjectId inputs match correctly
    user_id: new mongoose.Types.ObjectId(userId), 
    date: {
      $gte: start,
      $lte: end
    }
  })
  .populate('category', 'name monthly_limit')
  .sort({ date: -1 });
}

async function executeTool(userId, name, args) {
  logger.info(`Routing tool routing handler selection for function: "${name}"`);
  switch (name) {
    case 'logExpense':
      return await logExpense(userId, args.amount, args.categoryId, args.description, args.date);
    case 'createCategory':
      return await createCategory(userId, args.name, args.description, args.monthlyLimit);
    case 'viewAllCategories':
      return await viewAllCategories(userId);
    case 'modifyMonthlyLimitForCategory':
      return await modifyMonthlyLimitForCategory(userId, args.categoryId, args.newLimit);
    case 'getExpensesInTimeRange':
      return await getExpensesInTimeRange(userId, args.startDate, args.endDate);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function streamGroqToSSE(messages, res, { tools: useTools } = {}) {
  logger.info(`Initiating streamed Groq connection loop using model: ${GROQ_MODEL}`);
  const stream = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages,
    ...(useTools ? { tools, tool_choice: 'auto' } : {}),
    stream: true,
  });

  const toolCalls = {};
  let accumulatedText = ''; // <--- Track the running text tokens locally

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      accumulatedText += delta.content; // Capture text on the fly
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

  const calls = Object.values(toolCalls).filter((tc) => tc.id);
  if (calls.length) {
    logger.info(`Groq response chunk processed. Identified tool execution payload requirement.`, calls);
  }

  // Return a unified state execution payload package
  return {
    toolCalls: calls.length ? calls : null,
    textResponse: accumulatedText || null
  };
}
async function streamOllama(prompt, res) {
  logger.info(`Initiating Ollama generation fallback loop using model: ${OLLAMA_MODEL}`);
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error(`Ollama stream setup failure returned error payload.`, err);
    return res.status(response.status).json({ error: err, code: 'OLLAMA_ERROR' });
  }

  initSSE(res);
  Readable.fromWeb(response.body).on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (!line) return;
    try {
      const parsed = JSON.parse(line);
      if (parsed.response) writeSSE(res, 'content', { delta: parsed.response });
      if (parsed.done) writeSSE(res, 'done', {});
    } catch (parseErr) {
      // ignore malformed chunks
    }
  }).on('end', () => {
    logger.info(`Ollama event data-stream complete.`);
    res.end();
  });
}

const Message = require('../models/Message'); // Paths matching your project workspace

exports.talk = async (req, res, next) => {
  const userId = req.user._id;
  logger.info(`Received API request handling incoming /talk prompt for User ID: ${userId}`);

  try {
    const { prompt } = req.body;
    if (!prompt) {
      logger.warn(`Rejected invalid incoming conversation payload: Missing prompt parameter.`);
      return res.status(400).json({ error: 'prompt is required', code: 'VALIDATION_ERROR' });
    }

    if (AGENT_PROVIDER === 'ollama') {
      return streamOllama(prompt, res);
    }

    // 1. Establish the SSE pipeline instantly to keep UI feedback rapid
    initSSE(res);

    // 2. Fetch full historical context for this specific user
    const historicalMessages = await Message.find({ user_id: userId }).sort({ createdAt: 1 });

    // 3. Flush existing history to React immediately over the active SSE line
    // writeSSE(res, 'chat_history', historicalMessages);

    // 4. Persist the brand new user intent directly to MongoDB
    const newUserMessage = await Message.create({
      user_id: userId,
      role: 'user',
      content: prompt
    });

    // 5. Fetch operational categories context for grounding memory
    const existingCategories = await Category.find({ user_id: userId });
    const categoryContext = existingCategories.map(c => `- ID: ${c._id}, Name: "${c.name}"`).join('\n');

    // 6. Build the message array for Groq
    // Format historical messages to strictly match the shape expected by Groq's SDK
    const formattedHistory = historicalMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      ...(msg.name && { name: msg.name }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls })
    }));

    const messages = [
      { 
        role: 'system', 
        content: `You are a strict expense tracking assistant. 
Here are the user's existing categories in the database:
${categoryContext || "None (The user has no categories yet)"}

CRITICAL BUSINESS RULES:
- Before calling 'createCategory', check if the item fits an existing category name or real concept.
- If an appropriate category exists, reuse its ID. Do NOT create duplicate categories.
- Only call 'createCategory' if the request completely falls outside of what already exists.
- Final response should not have any kind object id, mongo db schema names or technical information. 
- Final response should have a intelligent question that will be helpful to the user.
- Do not answer it is not related to budget, finance and expenses.
`
      },
      ...formattedHistory,
      { role: 'user', content: prompt } // Append the current interaction
    ];

    const { toolCalls, textResponse: plainTextResponse } = await streamGroqToSSE(messages, res, { tools: true });

    if (toolCalls?.length) {
      const toolCall = toolCalls[0];
      let args = {};
      
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        logger.error(`Failed parsing generated tool parameters structure from raw LLM output.`, e);
        throw new Error(`Failed parsing tool arguments from model model output: ${e.message}`);
      }

      logger.info(`Executing agent-requested tool sequence: "${toolCall.function.name}" with parameters:`, args);
      writeSSE(res, 'tool_call', { name: toolCall.function.name, args });

      // Save the assistant's tool-calling state block to MongoDB
      await Message.create({
        user_id: userId,
        role: 'assistant',
        content: null,
        tool_calls: toolCalls
      });

      let stringifiedResult;
      try {
        const localResult = await executeTool(userId, toolCall.function.name, args);
        stringifiedResult = JSON.stringify(localResult);
        logger.info(`Tool executed cleanly.`);
      } catch (toolError) {
        logger.warn(`Target tool wrapper execution thrown safe logic block rejection: ${toolError.message}`);
        stringifiedResult = JSON.stringify({ error: toolError.message });
      }

      writeSSE(res, 'tool_result', { name: toolCall.function.name, content: JSON.parse(stringifiedResult) });

      // Save the structural outcome execution response straight to MongoDB
      await Message.create({
        user_id: userId,
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: stringifiedResult
      });

      // Update transient chat history array for the secondary summary generation hook
      messages.push({ role: 'assistant', content: null, tool_calls: toolCalls });
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: stringifiedResult,
      });

      logger.info(`Injecting context variables into chat thread. Streaming secondary final conversational summary...`);
      
      // Execute the secondary stream generation and extract the accumulated text
      const { textResponse: finalTextResponse } = await streamGroqToSSE(messages, res);

      // Save the final conversational summary explaining the outcome to long-term memory
      if (finalTextResponse) {
        await Message.create({
          user_id: userId,
          role: 'assistant',
          content: finalTextResponse
        });
      }
    } else {
      // If NO tool calls occurred during initial generation step, save the plain text response safely
      if (plainTextResponse) {
        await Message.create({
          user_id: userId,
          role: 'assistant',
          content: plainTextResponse
        });
      }
    }

    logger.info(`Conversation pipeline completed cleanly. Closing Server-Sent Events channel wrapper.`);
    writeSSE(res, 'done', {});
    res.end();
  } catch (err) {
    // console.log(e)
    logger.error(`Fatal crash caught inside central route handler context execution wrapper loop.`, err);
    if (!res.headersSent) return next(err);
    writeSSE(res, 'error', { message: err.message });
    res.end();
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    
    // Fetch stored chat structures ordered chronologically
    const history = await Message.find({ user_id: userId }).sort({ createdAt: 1 });
    logger.info("Fetched history", history);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    logger.error(`Failed to retrieve user chat history:`, err);
    return res.status(500).json({ error: 'Failed to retrieve message logs.' });
  }
}

exports.agentHealth = async (req, res, next) => {
  res.json({ status: 'ok', provider: AGENT_PROVIDER, timestamp: new Date().toISOString() });
};