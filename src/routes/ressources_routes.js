const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const clientRsrcController = require('../controllers/ressouces_controller');
const session_verify = require('../middlewares/session_verify');
const operationController = require('../controllers/operation_controller');
const fondsController = require('../controllers/fonds_controller');

router.get('/langues', clientRsrcController.getLanguePreferee);

router.get('/type-acteurs', clientRsrcController.getAllTypeActeurs);
router.get('/type-operations', operationController.getAllTypeOperations);

router.get('/fonds', fondsController.getAllFonds);
router.get('/fonds/:code', fondsController.getOneFonds);
router.get('/fonds/:code/vls', fondsController.getAllVlsByFonds);

module.exports = router;