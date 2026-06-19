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
        parameters: { type: 'object', properties: {} }
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
  
  module.exports = tools;