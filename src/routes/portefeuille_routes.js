const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const session_verify = require('../middlewares/session_verify');
const portefeuilleController = require('../controllers/portefeuille_controller');

router.get('/', session_verify, portefeuilleController.getAllPortefeuilles);
router.get('/chart', session_verify, portefeuilleController.getGlobalPortefeuilleChart);
router.get('/:code_fonds/chart', session_verify, portefeuilleController.getOnePortefeuilleChart);
// router.get('/inactifs', session_verify, portefeuilleController.getUnactivePortefeuilles);
// router.get('/rejete', session_verify, portefeuilleController.getRejectedPortefeuilles);

module.exports = router;