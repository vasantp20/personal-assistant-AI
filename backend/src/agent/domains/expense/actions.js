const mongoose = require('mongoose');
const Expense = require('../../../models/Expense');
const Category = require('../../../models/Category');

async function logExpense(userId, amount, categoryId, description, date) {
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
  return await expense.save();
}

async function createCategory(userId, name, description, monthlyLimit) {
  try {
    const category = new Category({ user_id: userId, name, description, monthly_limit: monthlyLimit });
    return await category.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`A category named "${name}" already exists for this user.`);
    }
    throw error;
  }
}

async function viewAllCategories(userId) {
  return await Category.find({ user_id: userId });
}

async function modifyMonthlyLimitForCategory(userId, categoryId, newLimit) {
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, user_id: userId },
    { monthly_limit: newLimit },
    { new: true, runValidators: true }
  );
  if (!category) throw new Error('Category not found or does not belong to this user.');
  return category;
}

async function getExpensesInTimeRange(userId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return await Expense.find({
    user_id: new mongoose.Types.ObjectId(userId),
    date: { $gte: start, $lte: end }
  })
  .populate('category', 'name monthly_limit')
  .sort({ date: -1 });
}

async function executeExpenseTool(userId, name, args) {
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
      throw new Error(`Unknown expense tool: ${name}`);
  }
}

module.exports = { executeExpenseTool };