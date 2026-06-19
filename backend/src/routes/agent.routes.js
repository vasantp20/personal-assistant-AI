const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/agent.controller'); 
const agent = require('../agent/index')

router.post('/talk', agent.talk);
router.get('/health', ctrl.agentHealth);
router.get('/history', ctrl.getHistory);

module.exports = router;
