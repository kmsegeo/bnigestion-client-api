const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const onbordingController = require('../controllers/onbording_controller.js');

// PARTICULIER

router.post('/acteurs/particulier', app_auth, onbordingController.onbordingParticulier);

// router.post('/particulier/:particulierId/kyc', app_auth, onbordingController.createParticulierKYC);
// router.get('/particulier/:particulierId/kyc', app_auth, onbordingController.getParticulierKYC);
// router.put('/particulier/:particulierId/kyc', app_auth, onbordingController.updateParticulierKYC);

// router.post('/particulier/:particulierId/personne_contacter', app_auth, onbordingController.createPersonEmergency);
// router.get('/particulier/:particulierId/personne_contacter', app_auth, onbordingController.getAllPersonEmergency);

router.post('/acteurs/:acteurId/motdepasse/activer', app_auth, onbordingController.createPassword);

router.get('/acteurs/:acteurId/otp/renvoyer', app_auth, onbordingController.renvoiOtp);
router.post('/acteurs/:acteurId/otp/verifier', app_auth, onbordingController.verifierOtp);


module.exports = router;