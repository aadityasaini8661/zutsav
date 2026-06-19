const router = require('express').Router();
const ctrl   = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, ctrl.chat);

module.exports = router;
