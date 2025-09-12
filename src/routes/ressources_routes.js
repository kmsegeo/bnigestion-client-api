const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const clientRsrcController = require('../controllers/ressouces_controller');
const session_verify = require('../middlewares/session_verify');
const operationController = require('../controllers/operation_controller');
const fondsController = require('../controllers/fonds_controller');

router.get('/type-acteurs', app_auth, clientRsrcController.getAllTypeActeurs);
router.get('/type-operations', app_auth, session_verify, operationController.getAllTypeOperations);

router.get('/fonds', app_auth, session_verify, fondsController.getAllFonds);
router.get('/fonds/:code', app_auth, session_verify, fondsController.getOneFonds);

router.get('/langues', app_auth, clientRsrcController.getLanguePreferee);

module.exports = router;