const router = require('express').Router();
const ctrl   = require('../controllers/panchang.controller');

router.get('/',     ctrl.getPanchang);
router.get('/week', ctrl.getWeekPanchang);

module.exports = router;
