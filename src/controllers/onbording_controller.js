const response = require("../middlewares/response");
const Utils = require("../utils/utils.methods");
const TypeActeur = require("../models/TypeActeur");
const Acteur = require("../models/Acteur");
const Client = require("../models/Client");

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
    await Utils.expectedParameters({civilite, nom, prenom, date_naissance, email, telephone, type_piece, numero_piece, validite_piece}).then(async () => {
        
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
                    // const data = DataFormat.replaceIndividualDataNumeriques(particulier); 
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
    return response(res, 200, 'Password created');
}

const renvoiMotdepasseOtp = async (req, res, next) => {
    return response(res, 200, 'OTP renvoyé');
}

const verifierOtp = async (req, res, next) => {
    return response(res, 200, 'OTP vérifié');
}

module.exports = {
    onbordingParticulier,
    createPassword,
    renvoiMotdepasseOtp,
    verifierOtp
}