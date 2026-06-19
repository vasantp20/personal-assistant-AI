const tools = [
    {
      type: 'function',
      function: {
        name: 'checkNewCarsNow',
        description: 'Triggers an immediate, real-time scraping sweep on Spinny to find matching models and send notifications.',
        parameters: { type: 'object', properties: {} }
      }
    },
    {
      type: 'function',
      function: {
        name: 'updateTrackingCriteria',
        description: 'Dynamically adjusts the user preference rules for cars (e.g. maximum price limit or year boundaries).',
        parameters: {
          type: 'object',
          properties: {
            maxPrice: { type: 'number', description: 'Maximum price limit in INR.' },
            minYear: { type: 'number', description: 'Minimum manufacturing year constraint.' }
          }
        }
      }
    }
  ];
  
  module.exports = tools;