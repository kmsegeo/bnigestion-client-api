const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const onbordingController = require('../controllers/onbording_controller.js');

// PARTICULIER

router.post('/acteurs/particulier', onbordingController.onbordingParticulier);

router.get('/acteurs/:acteurId/otp/renvoyer', onbordingController.renvoiOtp);
router.post('/acteurs/:acteurId/otp/verifier', onbordingController.verifierOtp);

module.exports = router;