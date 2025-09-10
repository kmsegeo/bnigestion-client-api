const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const sessionController = require('../controllers/session_controller.js');

router.post('/', app_auth, sessionController.connect);

module.exports = router;