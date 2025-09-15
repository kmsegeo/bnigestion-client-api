const { Column } = require("pg-promise");
const response = require("../middlewares/response");
const CompteDepot = require("../models/CompteDepot");

const createCompteDepot = async (req, res, next) => {
    console.log(`Création de compte de dépôt..`);
    const acteurId = req.session.e_acteur;
    await CompteDepot.findByActeur(acteurId).then(async compte => {
        if (compte) return response(res, 400, `Un compte existe déjà pour cet utilisateur`, compte);
        await CompteDepot.create({acteur: acteurId}).then(async result => {
            return response(res, 201, "Création du compte terminé", result);
        }).catch(err => console.log(err));
    }).catch(err => next(err));
}

const getCompteDepot = async (req, res, next) => {

    console.log('Affichage du compte de dépôt..');
    const acteurId = req.session.e_acteur;

    await CompteDepot.findByActeur(acteurId).then(async compte => {
        if (!compte) return response(res, 404, `Compte de dépôt introuvable !`);
        return response(res, 200, `Chargement du compte terminé`, compte);
    }).catch(err => next(err));

}

const operationDepotComplet = async (req, res, next) => {
    
    console.log('Wenhook::Reponse de paiement wave..')

    const acteurId = req.session.e_acteur;
    const {id, type, data} = req.body;

    Utils.expectedParameters({id, type, data}).then(async () => {

        await CompteDepot.findByActeur(acteurId).then(async compte => {
            if (!compte) return response(res, 404, `Compte de dépôt inexistant`);
            console.log(`Debut du dépôt sur compte de dépôt`);
            const newMontant = Number(compte.r_solde_disponible) + Number(data.amount);
            await CompteDepot.update(acteurId, {montant: newMontant}).then(async result => {
                console.log(`Dépôt sur le compte termné`);
                console.log('Solde:', result.r_montant);
            }).catch(err => console.log(err));

        }).catch(err => next(err));
    }).catch(err => next(err));

}

module.exports = {
    createCompteDepot,
    getCompteDepot,
    operationDepotComplet
}