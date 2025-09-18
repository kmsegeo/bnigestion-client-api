const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const comteDepotController = require('../controllers/compte_depot_controller');

// router.patch('/', app_auth, session_verify, comteDepotController.createCompteDepot);
router.get('/', session_verify, comteDepotController.getCompteDepot);

module.exports = router;