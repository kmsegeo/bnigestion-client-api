const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const operationController = require('../controllers/operation_controller');

router.get('/', app_auth, session_verify, operationController.getAllActeurOperations);
router.get('/:ref', app_auth, session_verify, operationController.getOneOperation);
router.post('/depot', app_auth, session_verify, operationController.opDepot);
router.post('/souscription', app_auth, session_verify, operationController.opSouscription);
router.get('/rachat', app_auth, session_verify, operationController.opRachat);
router.post('/transfert', app_auth, session_verify, operationController.opTransfert);

module.exports = router;