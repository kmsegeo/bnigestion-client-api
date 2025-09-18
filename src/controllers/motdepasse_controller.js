const response = require("../middlewares/response");
const Acteur = require("../models/Acteur");
const Utils = require("../utils/utils.methods");
const bcrypt = require("bcryptjs");
const Message = require("../models/Message");
const uuid = require("uuid");

const resetPassword = async (req, res, next) => {

    const email = req.body.email;
    const telephone = req.body.telephone;

    // await Particulier.findByCompteTitre(identifiant).then(async particulier => {
    //     if (!particulier) return response(res, 404, `Entrez un compte titre valide svp !`);

    let acteur = null;

    try {
            
        await Utils.expectedParameters({email, telephone}).then(async () => {
            
            acteur = await Acteur.findByEmail(email);
            if (!acteur) return response(res, 404, `Cette adresse e-mail semble ne correspondre à aucun utilisateur !`);
            if (!acteur.r_telephone_prp) return response(res, 404, `Numéro de téléphone introuvable !`);
            if (acteur.r_telephone_prp!=telephone) return response(res, 400, `Le numéro de téléphone semble ne pas correspondre !`);

            // acteur = await Acteur.findByTelephone(telephone)
            // if (!acteur) return response(res, 404, `Ce numéro mobile semble ne correspondre à aucun utilisateur !`);
            
            await Message.clean(acteur.r_i, 2).catch(err => next(err));          // 1: activation, 2: reinitialisation

            const url = process.env.ML_SMSCI_URL;

            await Utils.aleatoireOTP().then(async otp => {
                await Utils.genearte_msgid().then(async msgid => {
                    await Message.create(acteur.r_i, {msgid, type:1, contenu:otp, operation:2}).then(async msg => {
                        await fetch(url, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                identify: process.env.ML_SMS_ID,
                                pwd: process.env.ML_SMS_PWD,
                                fromad: "BNI CI",
                                toad: acteur.r_telephone_prp,
                                msgid: msgid,
                                text: `Votre code de vérification est : ${msg.r_contenu}`
                            })
                        }).then(res => res.json())
                        .then(data => {
                            if (data!=1) return response(res, 400, `Envoi de message echoué`, data);
                            console.log('code otp :', msg.r_contenu);
                            return response(res, 200, `Message otp renvoyé avec succès`);
                        })
                    }).catch(err => next(err)); 
                }).catch(err => next(err));
            }).catch(err => next(err));

        }).catch(err => response(res, 400, err));

    } catch (error) {
        next(error);
    }
}

const updatePassword = async (req, res, next) => {

    const {phone, cur_mdp, new_mdp} = req.body;

    await Utils.expectedParameters({phone, cur_mdp, new_mdp}).then(async () => {
        await Acteur.findByTelephone(phone).then(async acteur => {
            if (!acteur) return response(res, 404, `Acteur introuvable !`);
            await bcrypt.compare(cur_mdp, acteur.r_mdp).then(async valid => {
                if(!valid) return response(res, 401, `Code de réinitialisation incorrect !`);
                console.log(`Hashage du mot de passe`);
                await bcrypt.hash(new_mdp, 10).then(async hash => {
                    await Acteur.updatePassword(acteur.r_i, hash).then(async result => {
                        if (!result) return response(res, 400, `Une erreur s'est produite à la création du mot de passe !`);
                        return response(res, 200, `Mot de passe modifier avec succès`);
                    }).catch(err => next(err));
                }).catch(err => next(err));
            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => response(res, 400, err));
}


const renvoiOtp = async (req, res, next) => {

    console.log(`Renvoi du message OTP..`);
    
    const phone = req.query.phone;
    
    await Acteur.findByTelephone(phone).then(async acteur => {
        if (!acteur) return response(res, 404, `Cet acteur n'existe pas !`);
        if (!acteur.r_telephone_prp) return response(res, 400, `Numéro de téléphone principal introuvable !`);

        await Message.findByActeurId(acteur.r_i).then(async msg => {
            if (!msg) return response(res, 404, `Aucun message otp trouvé !`);

            const operation = msg.r_operation;
            await Message.clean(acteur.r_i).catch(err => next(err));                          // Operation: 1: activation, 2: reinitialisation

            const url = process.env.ML_SMSCI_URL;
            
            await Utils.aleatoireOTP().then(async otp => {
                await Utils.genearte_msgid().then(async msgid => {
                    await Message.create(acteur.r_i, {msgid, type:1, contenu:otp, operation}).then(async msg => {
                        console.log('otp généré:', otp);
                        console.log(`Envoi de message:${msgid}..`);
                        await fetch(url, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                identify: process.env.ML_SMS_ID,
                                pwd: process.env.ML_SMS_PWD,
                                fromad: "BNI CI",
                                toad: acteur.r_telephone_prp,
                                msgid: msgid,
                                text: `Votre code de vérification est : ${msg.r_contenu}`
                            })
                        }).then(res => res.json())
                        .then(data => {
                            if (data!=1) return response(res, 400, `Envoi de message echoué`, data);
                            return response(res, 200, `Message otp renvoyé avec succès`, msg);
                        })
                    }).catch(err => next(err)); 
                }).catch(err => next(err));
            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => next(err));

}

const verifierOtp = async (req, res, next) => {
     
    console.log(`Vérification OTP..`);
    
    const phone = req.body.phone;
    const otp = req.body.otp;
    
    Utils.expectedParameters({phone, otp}).then(async () => {
        await Acteur.findByTelephone(phone).then(async acteur => {

            if (!acteur) return response(res, 404, `Cet acteur n'existe pas !`);
            
            await Message.findByActeurId(acteur.r_i).then(async msg => {
                if (!msg) return response(res, 404, `Pas de OTP en cours de validité !`);
                if (otp!=msg.r_contenu) return response(res, 400, `Vérification echoué !`);
                
                const data = {};
                if (msg.r_operation==2) {
                    const default_mdp = uuid.v4().split('-')[0];
                    await bcrypt.hash(default_mdp, 10).then(async hash => {
                        await Acteur.updatePassword(acteur.r_i, hash).then(async pwd => {
                            data['reset_mdp'] = default_mdp;
                            await Message.confirm(acteur.r_i, msg.r_i).catch(err => next(err)); 
                            return response(res, 200, `Vérification terminé avec succès`, data);
                        }).catch(err => next(err));
                    }).catch(err => next(err));
                }

            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => response(res, 400, err));
}


module.exports = {
    resetPassword,
    renvoiOtp,
    verifierOtp,
    updatePassword
}