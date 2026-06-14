const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/agent.controller');

router.post('/talk', ctrl.talk);
router.get('/health', ctrl.agentHealth);
router.get('/history', ctrl.getHistory);

module.exports = router;
