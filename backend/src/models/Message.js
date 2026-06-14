const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Highly recommended for fast history lookups per user
  },
  role: { 
    type: String, 
    enum: ['user', 'assistant', 'tool'], 
    required: true 
  },
  content: { 
    type: String, 
    default: null 
  },
  // Used exclusively by the 'tool' role to tie the answer back to the request
  tool_call_id: { 
    type: String, 
    default: null 
  },
  // Used by the 'tool' role to identify the execution target name
  name: { 
    type: String, 
    default: null 
  },
  // Used exclusively by the 'assistant' role when triggering tools
  tool_calls: { 
    type: Array, 
    default: undefined 
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);