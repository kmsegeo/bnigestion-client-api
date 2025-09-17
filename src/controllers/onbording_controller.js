const response = require("../middlewares/response");
const Utils = require("../utils/utils.methods");
const TypeActeur = require("../models/TypeActeur");
const Acteur = require("../models/Acteur");
const Client = require("../models/Client");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");
const CompteDepots = require("../models/CompteDepot");


const onbordingParticulier = async (req, res, next) => {
    
    /**
     * [] Vérifier que les paramètres attendu sont bien reçu, ainsi que ceux obligatoires
     * [] Vérifier que le compte (l'adresse e-mail/le numéro de telephone) n'existe pas,
     *    - S'il existe retourner une erreur 409 
     *    - Sinon poursuivre la création de compte
     * [] Créer le compte acteur avec un statut à 0 (compte en attente d'activation)
     * [] Créer le compte particulier
     */
    console.log(`Création d'un compte particulier..`);

    const {
        civilite, 
        nom, 
        nom_jeune_fille, 
        prenom, 
        date_naissance, 
        nationalite, 
        type_piece, 
        numero_piece, 
        validite_piece, 
        email, 
        telephone, 
        adresse} = req.body;

    console.log(`Vérification des paramètres`);
    await Utils.expectedParameters({civilite, nom, prenom, date_naissance, email, telephone}).then(async () => {
        
        console.log(`Vérification de l'existance du compte`);
        await Acteur.findByEmail(email).then(async exists_email => {
            if (exists_email) return response(res, 409, `Cette adresse email existe déjà !`);
            
        await Acteur.findByTelephone(telephone).then(async exists_phone => {
            if (exists_phone) return response(res, 409, `Ce numéro de téléphone existe déjà !`);
    
        console.log(`Récupération de l'id du type acteur`);
        await TypeActeur.findByCode("TYAC002").then(async type_acteur => {
            if (!type_acteur) return response(res, 400, `Problème survenu lors de la determination du type acteur`);

            await Acteur.create({
                nom_complet: nom + ' ' + prenom, 
                email: email, 
                telephone: telephone, 
                adresse: adresse, 
                type_acteur: type_acteur.r_i,
            }).then(async acteur => { 
                console.log(`Création du compte particulier`);
                await Client.Particulier.create({
                    civilite, 
                    nom, 
                    nom_jeune_fille, 
                    prenom, 
                    date_naissance, 
                    nationalite, 
                    type_piece, 
                    numero_piece, 
                    validite_piece,
                    e_acteur: acteur.r_i
                }).then(async particulier => {
                    if (!particulier) return response(res, 400, `Une erreur s'est produite !`);
                    particulier['acteur'] = acteur;
                    return response(res, 201, `Compte particulier créé avec succès`, particulier); 
                }).catch(error => next(error));
            }).catch(error => next(error));
        }).catch(error => next(error));
        }).catch(error => next(error));
        }).catch(error => next(error));
    }).catch(error => response(res, 400, error));
}

const createPassword = async (req, res, next) => {
    
    console.log(`Création de mote de passe..`)
    
    const acteur_id = req.params.acteurId;
    const mdp = req.body.mdp;

    await Acteur.findById(acteur_id).then(async acteur => {
        if (!acteur) return response(res, 404, `Acteur introuvable !`);
        if (acteur.r_statut!=0) return response(res, 409, `Se compte semble déjà actif !`)
        console.log(`Hashage du mot de passe`);
        await bcrypt.hash(mdp, 10).then(async hash => {
            console.log(hash);
            await Acteur.updatePassword(acteur_id, hash).then(async result => {
                if (!result) return response(res, 400, `Une erreur s'est produite à la création du mot de passe !`);
                
                await Message.clean(acteur_id).catch(err => next(err)); 

                await Utils.aleatoireOTP().then(async otp => {
                    await Utils.genearte_msgid().then(async msgid => {
                        await Message.create(acteur_id, {msgid, type:1, contenu:otp, operation: 1}).then(async message => { 
                            console.log('otp généré:', otp);
                            console.log('Envoi de message:', msgid, '..');
                            await fetch(process.env.ML_SMSCI_URL, {
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
                                    text: `Votre code de vérification est : ${message.r_contenu}`
                                })
                            }).then(res => res.json()).then(data => {
                                if (data!=1) return response(res, 200, `Envoi de message echoué`, data);
                                return response(res, 200, `Message de vérification envoyé`);
                            }).catch(err => next(err)); 
                        }).catch(err => next(err)); 
                    }).catch(err => next(err));
                }).catch(err => next(err));
                
            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => next(err));
}

const renvoiOtp = async (req, res, next) => {
    
    console.log(`Renvoi du message OTP..`);
    
    const acteur_id = req.params.acteurId;
    
    await Acteur.findById(acteur_id).then(async acteur => {
        if (!acteur) return response(res, 404, `Cet acteur n'existe pas !`);
        if (!acteur.r_telephone_prp) return response(res, 400, `Numéro de téléphone principal introuvable !`);

        await Message.findByActeurId(acteur_id).then(async msg => {
            if (!msg) return response(res, 404, `Aucun message otp trouvé !`);

            const operation = msg.r_operation;
            await Message.clean(acteur_id).catch(err => next(err));                          // Operation: 1: activation, 2: reinitialisation

            const url = process.env.ML_SMSCI_URL;
            
            await Utils.aleatoireOTP().then(async otp => {
                await Utils.genearte_msgid().then(async msgid => {
                    await Message.create(acteur_id, {msgid, type:1, contenu:otp, operation}).then(async msg => {
                        console.log('otp généré:', otp);
                        console.log('Envoi de message:', msgid, '..');
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
                                return response(res, 200, `Message otp renvoyé avec succès`, otp);
                        })
                    }).catch(err => next(err)); 
                }).catch(err => next(err));
            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => next(err));
}

const verifierOtp = async (req, res, next) => {
    
    console.log(`Vérification OTP..`);
    
    const acteur_id = req.params.acteurId;
    const otp = req.body.otp;
    
    await Acteur.findById(acteur_id).then(async acteur => {
        if (!acteur) return response(res, 404, `Cet acteur n'existe pas !`);
        
        await Message.findByActeurId(acteur_id).then(async msg => {
            if (!msg) return response(res, 400, `Pas de OTP en cours de validité !`);
            if (otp!=msg.r_contenu)  return response(res, 400, `Vérification echoué !`);
            
            const data = {};

            if (msg.r_operation==1) {
                if (!acteur.r_telephone_prp) return response(res, 404, `Numéro de téléphone principal introuvable !`);
                console.log(`Chargement des données de l'acteur: particulier, kyc, documents, ..`)
                await Client.Particulier.findByActeurId(acteur_id).then(async particulier => {
                    if (!particulier) return response(res, 403, `Compte particulier introuvable !`);
                    Acteur.activeCompte(acteur_id).catch(err => next(err));
                    Message.confirm(acteur_id, msg.r_i).catch(err => next(err)); 
                    return response(res, 200, `Vérification terminé avec succès`);
                }).catch(err => next(err));

            } else if (msg.r_operation==2) {
                const default_mdp = uuid.v4().split('-')[0];
                await bcrypt.hash(default_mdp, 10).then(async hash => {
                    await Acteur.updatePassword(acteur_id, hash).then(async pwd => {
                        data['reset_mdp'] = default_mdp;
                        await Message.confirm(acteur_id, msg.r_i).catch(err => next(err)); 
                        return response(res, 200, `Vérification terminé avec succès`, data);
                    }).catch(err => next(err));
                }).catch(err => next(err));
            }

        }).catch(err => next(err));
    }).catch(err => next(err));

}

module.exports = {
    onbordingParticulier,
    createPassword,
    renvoiOtp,
    verifierOtp
}