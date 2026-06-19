const Category = require('../../../models/Category');

async function buildExpensePrompt(userId) {
  const existingCategories = await Category.find({ user_id: userId });
  const categoryContext = existingCategories.map(c => `- ID: ${c._id}, Name: "${c.name}"`).join('\n');

  return `You are a strict expense tracking assistant. 
Here are the user's existing categories in the database:
${categoryContext || "None (The user has no categories yet)"}

CRITICAL BUSINESS RULES:
- Before calling 'createCategory', check if the item fits an existing category name or real concept.
- If an appropriate category exists, reuse its ID. Do NOT create duplicate categories.
- Only call 'createCategory' if the request completely falls outside of what already exists.
- Final response should not have any kind object id, mongo db schema names or technical information. 
- Final response should have a intelligent question that will be helpful to the user.
- Do not answer it is not related to budget, finance and expenses.`;
}

module.exports = { buildExpensePrompt };