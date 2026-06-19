const tools = [
    {
      type: 'function',
      function: {
        name: 'bookTicket',
        description: 'Books a bus or train ticket based on transit type, destination, and timing windows.',
        parameters: {
          type: 'object',
          properties: {
            transitType: { type: 'string', enum: ['bus', 'train'], description: 'The transit type choosing to travel.' },
            destination: { type: 'string', description: 'Target destination city.' },
            departureDate: { type: 'string', description: 'ISO date tracking departure date structure.' }
          },
          required: ['transitType', 'destination', 'departureDate']
        }
      }
    }
  ];
  
  module.exports = tools;