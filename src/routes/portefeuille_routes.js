const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const portefeuilleController = require('../controllers/portefeuille_controller');

router.get('/', app_auth, session_verify, portefeuilleController.getLastPortefeuilles);

module.exports = router;