const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

router.post('/register', ctrl.registerValidation, ctrl.register);
router.post('/login', ctrl.loginValidation, ctrl.login);
router.post('/refresh', ctrl.refreshValidation, ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', auth, ctrl.me);

module.exports = router;
