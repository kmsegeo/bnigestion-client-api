const express = require('express');
const router = express.Router();
const app_auth = require('../middlewares/app_auth');
const motdepasseController = require('../controllers/motdepasse_controller.js');

router.post('/reinitialiser', motdepasseController.resetPassword);

router.get('/otp/renvoyer', motdepasseController.renvoiOtp);
router.post('/otp/verifier', motdepasseController.verifierOtp);

router.put('/modifier', motdepasseController.updatePassword);

module.exports = router;