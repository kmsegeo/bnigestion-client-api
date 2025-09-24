const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const operationController = require('../controllers/operation_controller');

router.post('/depot', session_verify, operationController.opDepot);
router.post('/souscription', session_verify, operationController.opSouscription);
router.get('/rachat', session_verify, operationController.opRachat);
router.post('/transfert', session_verify, operationController.opTransfert);

router.get('/', session_verify, operationController.getAllActeurOperations);
router.get('/export/:debut/:fin/pdf', session_verify, operationController.exportActeurOperation);

module.exports = router;