const express = require('express');
const router = express.Router();
const auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const sessionController = require('../controllers/session_controller.js');

router.get('/', auth, session_verify, sessionController.loadSommaire);

module.exports = router;