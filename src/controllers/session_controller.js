const response = require("../middlewares/response");
const Acteur = require("../models/Acteur");
const Utils = require("../utils/utils.methods");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { Particulier, Entreprise } = require("../models/Client");
const Document = require("../models/Document");

const connect = async (req, res, next) => {
    
    /**
     * [x] Récupérer les données de l'acteur à partir de l'adresse e-mail
     * [x] Comparer le mot pas entré avec celui enregistré avec les données récupérées
     * [x] Si valid: créer une session avec les information entrée dans le header
     */

    console.log(`Connexion..`);
    const {email, mdp} = req.body;

    console.log(req.headers.app_id)
    
    console.log(`Vérification des paramètres`);
    Utils.expectedParameters({email}).then(async () => {

        console.log(`Chargement de l'acteur`);
        await Acteur.findByEmail(email).then(async acteur => {
            if (!acteur) return response(res, 401, `Login ou mot de passe incorrect !`);
            if (acteur.e_type_acteur && acteur.e_type_acteur=='1') return response(res, 401, `Ce compte n'est pas enregistré en tant que client`);
            if (acteur.r_statut==0 || acteur.r_date_activation==undefined) return response(res, 401, `Ce compte n'a pas été activé !`);
            console.log(`Vérification de mot de passe`)
            await bcrypt.compare(mdp, acteur.r_mdp).then(async valid => {
                if(!valid) return response(res, 401, `Login ou mot de passe incorrect !`);
                if (acteur.r_statut==-1) return response(res, 401, `Ce compte à été supprimé !`);
                console.log(`Création de session`)
                await Session.create({
                    os: req.headers.os,
                    adresse_ip: req.headers.adresse_ip,
                    marque: req.headers.marque,
                    model: req.headers.model,
                    acteur: acteur.r_i,
                    canal: req.headers.app_id
                }).then(async session => {

                    if (acteur.e_type_acteur && acteur.e_type_acteur=='2') {            // Particulier
                        
                        await Particulier.findByActeurId(acteur.r_i).then(async particulier => {
                            if (!particulier) return response(res, 400, `Une erreur s'est produite à la récupération du compte client !`);
                            
                            // console.log(`Chargement des personnes à contacter`);
                            // await PersonEmergency.findAllByParticulier(acteur.e_particulier).then(async personnes => {
                            //     particulier['personnes_contacter'] = personnes;
                            // }).catch(err => next(err));

                            acteur['particulier'] = particulier;
                        }).catch(err => next(err));

                    } else if (acteur.e_type_acteur && acteur.e_type_acteur=='3') {     // Entreprise

                        console.log(`Chargement des données entreprise`);
                        await Entreprise.findByActeurId(acteur.r_i).then(async entreprise => {
                            if (!entreprise) return response(res, 400, `Une erreur s'est produite à la récupération du compte client !`);

                            // console.log(`Chargement des mebmbres du personnel`);
                            // await PersonnelEntreprise.findByEntrepriseId(entreprise.r_i).then(async personnels => {
                            //     entreprise['personnels'] = personnels;
                            // }).catch(err => next(err));

                            acteur['entreprise'] = entreprise;
                        }).catch(err => next(err));
                    }
                    
                    console.log(`Chargement des documents de l'acteur`);
                    await Document.findAllByActeurId(acteur.r_i).then(async documents => {
                        acteur['documents'] = documents;
                    }).catch(err => next(err));
                    
                    delete acteur.r_mdp;
                    delete acteur.e_type_acteur;
                    delete acteur.r_statut;
                    delete session.r_statut
                    delete session.e_acteur;
                    delete session.e_canal;

                    return response(res, 200, 'Ouverture de session', {
                        auth_token: jwt.sign(
                            {session: session.r_reference},
                            process.env.SESSION_KEY,
                            // { expiresIn: '24h' }
                        ),
                        session: session,
                        acteur: acteur
                    });
                }).catch(error => next(error));
            }).catch(error => next(error));
        }).catch(error => next(error));
    }).catch(error => response(res, 400, error));
}

const loadActiveSsessions = async (req, res, next) => {
    /**
     * [x] Charger les sessions actives de l'agent
     */
    console.log(`Chargement des sessions de l'acteur`);
    await Session.findAllByActeur(req.session.e_acteur).then(sessions => {
        for (let index = 0; index < sessions.length; index++)
            delete sessions[index].r_statut;
        return response(res, 200, "Chargement terminé", sessions);
    }).catch(error => next(error));
}

const destroySession = async (req, res, next) => {
    /**
     * [x] Vérifier que la session reférencée existe
     * [x] Destruuire la session active selectionnée de l'agent
     */
    console.log(`Destruction de la session: ${req.params.ref}`);
    await Session.findByRef(req.params.ref).then(async session => {
        if (!session) return response(res, 404, "Session non trouvée");
        await Session.destroy({
            acteur: req.session.e_acteur, 
            ref: req.params.ref
        }).then(() => response(res, 200, "Session détruite"))
        .catch(error => next(error));
    }).catch(error => next(error));
}

module.exports = {
    connect,
    loadActiveSsessions,
    destroySession
}