const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify.js');
const sessionController = require('../controllers/session_controller.js');

router.get('/', app_auth, session_verify, sessionController.loadActiveSsessions);
router.delete('/:ref', app_auth, session_verify, sessionController.destroySession);

module.exports = router;