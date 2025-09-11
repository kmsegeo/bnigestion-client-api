const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const motdepasseController = require('../controllers/motdepasse_controller.js');

router.post('/reinitialiser', app_auth, motdepasseController.resetPassword);

router.get('/otp/renvoyer', app_auth, motdepasseController.renvoiOtp);
router.post('/otp/verifier', app_auth, motdepasseController.verifierOtp);

router.put('/modifier', app_auth, motdepasseController.updatePassword);

module.exports = router;