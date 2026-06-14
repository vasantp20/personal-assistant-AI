const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  monthly_limit: {
    type: Number,
    required: true,
    min: [0, 'Monthly limit cannot be negative'],
    default: 0
  }
}, { 
  timestamps: true // Gives you createdAt and updatedAt automatically
});

// Ensure a user can't create duplicate category names
categorySchema.index({ user_id: 1, name: 1 }, { unique: true });

categorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Category', categorySchema);