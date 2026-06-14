const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now // Defaults to current date if not specified
  }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: false } // Matches your User model config
});

// Indexing for performance when fetching expenses by user and time range
expenseSchema.index({ user_id: 1, date: -1 });

expenseSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Expense', expenseSchema);