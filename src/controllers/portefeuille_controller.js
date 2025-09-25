const e = require('express');
const default_data = require('../config/default_data');
const response = require('../middlewares/response');
const Fonds = require('../models/Fonds');
const Portefeuille = require('../models/Portefeuille');
const ValeurLiquidative = require('../models/ValeurLiquidative');
const { propfind } = require('../routes/ressources_routes');
const Utils = require('../utils/utils.methods');

const portefeuille_statuts = default_data.portefeuille_statuts

const getAllPortefeuilles = async (req, res, next) => {

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;
    try {

        let valeur_portefeuilles = 0;
        let cumultaux = 0;
        let historique = [];
        let portefeuilles_groupes = [];

        const portefeuilles = await Portefeuille.findAllByActeurId(acteurId);
        const fonds = await Fonds.findAll();
        
        let cptfd = 0;

        for (let f of fonds) {

            let portefeuille = {}
            let actions = []

            let cpt = 0;
            let parts = 0;
            let cours = 0;
            let vl = 0;
            let total = 0;
            let rendement = 0;
            let taux = 0;
            let valeur = 0;

            vl = await ValeurLiquidative.findLastByFonds(f.r_code);

            for(let p of portefeuilles) {
                
                if (f.r_i==p.e_fonds) {

                    if (p.r_statut==1) {
                        parts = Number(parts) + Number(p.r_nombre_parts);
                        cours = Number(cours) + Number(p.r_cours_placement);
                        total = Number(total) + Number(p.r_montant_placement);
                        cpt +=1;
                    }

                    p['r_intitule_fonds'] = f.r_intitule
                    p['t_type_fonds'] = f.r_type;
                    p['r_statut'] = portefeuille_statuts[p.r_statut];

                    delete p.r_i;
                    delete p.e_fonds;
                    delete p.e_acteur;
                    delete p.e_operation;

                    actions.push(p);
                }
            }

            rendement = ((Number(vl.r_valeur_courante) * parts) - total);
            taux = (rendement/total)*100;
            valeur = total + rendement;

            cumultaux = cumultaux + taux;
            valeur_portefeuilles = valeur_portefeuilles + valeur;

            portefeuille['r_code_fonds'] = f.r_code;
            portefeuille['r_intitule_fonds'] = f.r_intitule;
            portefeuille['t_type_fonds'] = f.r_type;
            portefeuille['r_taux_allocation'] = f.r_taux_allocation;
            portefeuille['r_nombre_parts'] = Number(parts.toFixed(2));
            portefeuille['r_valeur_liquidative'] = Number(vl.r_valeur_courante);
            portefeuille['r_cours_moy_placement'] = Number(cours/cpt);
            portefeuille['r_total_placement'] = total;
            portefeuille['r_rendement_total'] = Number(rendement.toFixed(2));
            portefeuille['r_rendement_positive'] = Number(rendement) > 0
            portefeuille['r_taux_rendement'] = taux.toFixed(2) + "%";
            portefeuille['r_valeur_placement'] = Number(valeur.toFixed(2));

            historique.push({
                fonds: f.r_intitule,
                actions
            });

            portefeuilles_groupes.push(portefeuille);
            cptfd +=1;
        }
        
        const data = {
            valeur_portefeuilles,
            rendement_global: (cumultaux/cptfd).toFixed(2) + "%",
            portefeuilles : portefeuilles_groupes, 
            historique: portefeuilles
        }

        return response(res, 200, 'Liste des portefeuilles', data);

    } catch (error) {
        next(error);
    }
}

const getUnactivePortefeuilles = async (req, res, next) => {

    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;
    try {
        const portefeuilles = await Portefeuille.findUnactiveByActeurId(acteurId);
        for(let p of portefeuilles) {
            let fonds = await Fonds.findById(p.e_fonds);
            p['r_intitule_fonds'] = fonds.r_intitule
            p['r_statut'] = portefeuille_statuts[p.r_statut];
            delete p.r_i;
            delete p.e_fonds;
            delete p.e_acteur;
            delete p.e_operation;
        }
        return response(res, 200, 'Liste des portefeuilles', portefeuilles);
    } catch (error) {
        next(error);
    }
}

const getActivesPortefeuilles = async (req, res, next) => {

    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;

    try {
        const portefeuilles = await Portefeuille.findActivesByActeurId(acteurId);
        for(let p of portefeuilles) {
            let fonds = await Fonds.findById(p.e_fonds);
            p['r_intitule_fonds'] = fonds.r_intitule
            p['r_statut'] = portefeuille_statuts[p.r_statut];

            delete p.r_i;
            delete p.e_fonds;
            delete p.e_acteur;
            delete p.e_operation;
        }
        return response(res, 200, 'Liste des portefeuilles actifs', portefeuilles);
    } catch (error) {
        next(error);
    }
}

const getRejectedPortefeuilles = async (req, res, next) => {

    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;
    try {
        const portefeuilles = await Portefeuille.findRejectedByActeurId(acteurId);
        for(let p of portefeuilles) {
            let fonds = await Fonds.findById(p.e_fonds);
            p['r_intitule_fonds'] = fonds.r_intitule
            p['r_statut'] = portefeuille_statuts[p.r_statut];

            delete p.r_i;
            delete p.e_fonds;
            delete p.e_acteur;
            delete p.e_operation;
        }
        return response(res, 200, 'Liste des portefeuilles', portefeuilles);
    } catch (error) {
        next(error);
    }
}

const getOnePortefeuilleChart = async (req, res, next) => {

    /**
     * [x] Créer une plage de date selon la période souhaité et remonter celle-ci
     * [x] Récupérer le cumule des montant enterieur du fonds souscrit à la date de depart de la periode définit
     * [x] Pour le fonds choisi, déduite la valeur liquidative à une date définit
     * [x] Cumuler les montants des fonds souscrit et calculer l'évolution sur la période
     */

    console.log(`Chargement des données du chart..`);

    const periods = ['semaine', 'mois', 'annee', '5ans'];

    try {

        const acteurid = req.session.e_acteur;
        
        let period = req.query.periode
        if (!period) period=periods[0];

        
        const code_fonds = req.params.code_fonds;
        const fonds = await Fonds.findByCode(code_fonds);

        console.log('code_fonds:', code_fonds, '\nperiode:', period);

        let evolutions = [];

        let message = '';
        const today = new Date();

        if (!periods.includes(period)) 
            return response(res, 400, `La période n'est pas correctement définit !`);
        
        if (period==`jour`) {          // 24h
            console.log(`Chargement des données de la journée`);
            return response(res, 403, `Les mises à jours sont hebdomadaires !`);
            
        } else if (period==`semaine`) {  // 7 jours
            message = `Chargement des données des 7 derniers jours`;       

            for (let i=6; i>=0; i--) {
                let date = new Date();
                date.setDate(date.getDate() - i);
                let e = await Utils.calculEvolutionPortefeuille(acteurid, fonds.r_i, date);
                if(e) evolutions.push(e);
            }
            
        } else if (period==`mois`) {     // 30 jours
            message = `Chargement des données des 30 derniers jours`;
            
            for (let i=30; i>=0; i--) {
                let date = new Date();
                date.setDate(date.getDate() - i);
                let e = await Utils.calculEvolutionPortefeuille(acteurid, fonds.r_i, date);
                if(e) evolutions.push(e);
            }            

        } else if (period==`annee`) {   // 12 mois
            message = `Chargement des données des 12 derniers mois`;

            for (let i=11; i>=0; i--) {
                let date = new Date();
                date.setMonth(date.getMonth() - i);
                let e = await Utils.calculEvolutionPortefeuille(acteurid, fonds.r_i, date);
                if(e) evolutions.push(e);
            }

        } else if (period==`5ans`) {   // 5 ans
            message = `Chargement des données des 5 dernières années`;

            for (let i=4; i>=0; i--) {
                let date = new Date();
                date.setFullYear(date.getFullYear() - i);
                let e = await Utils.calculEvolutionPortefeuille(acteurid, fonds.r_i, date);
                if(e) evolutions.push(e);
            }

        } else {                        // par vl

        }
        
        delete fonds.r_i        
        return response(res, 200, message, {periode: period, fonds, evolutions});

    } catch (error) {
        next(error);
    }
}

const getGlobalPortefeuilleChart = async (req, res, next) => { 

    console.log(`Chargement des données du chart..`);
    const periods = ['semaine', 'mois', 'annee', '5ans'];

    try {
        const acteurid = req.session.e_acteur;

        let period = req.query.periode
        if (!period) period=periods[0];
        
        const fonds = await Fonds.findAll();

        let evolutions = [];
        let message = '';

        if (!periods.includes(period)) 
            return response(res, 400, `La période n'est pas correctement définit !`);
        
        if (period==`jour`) {          // 24h
            console.log(`Chargement des données de la journée`);
            return response(res, 403, `Les mises à jours sont hebdomadaires !`);
            
        } else if (period==`semaine`) {  // 7 jours
            message = `Chargement des données des 7 derniers jours`;       

            for (let i=7; i>=0; i--) {
                let date = new Date();
                date.setDate(date.getDate() - i);
                let e = await calculEvolutionsCumulates(acteurid, date);
                if(e) evolutions.push(e);
            }
            
        } else if (period==`mois`) {     // 30 jours
            message = `Chargement des données des 30 derniers jours`;
            
            for (let i=30; i>=0; i--) {
                let date = new Date();
                date.setDate(date.getDate() - i);
                let e = await calculEvolutionsCumulates(acteurid, date);
                if(e) evolutions.push(e);
            }            

        } else if (period==`annee`) {   // 12 mois
            message = `Chargement des données des 12 derniers mois`;

            for (let i=12; i>=0; i--) {
                let date = new Date();
                date.setMonth(date.getMonth() - i);
                let e = await calculEvolutionsCumulates(acteurid, date);
                if(e) evolutions.push(e);
            }

        } else if (period==`5ans`) {   // 5 ans
            message = `Chargement des données des 5 dernières années`;

            for (let i=5; i>=0; i--) {
                let date = new Date();
                date.setFullYear(date.getFullYear() - i);
                let e = await calculEvolutionsCumulates(acteurid, date);
                if(e) evolutions.push(e);
            }

        } else {                        // par vl

        }

        async function calculEvolutionsCumulates(acteurid, date) {

            let e = {};
            let hasData = false;
            let nette_investis = 0;
            let rendement = 0;
            let valeur_portefeuille = 0;

            for (let f of fonds) {
                let evolution = await Utils.calculEvolutionPortefeuille(acteurid, f.r_i, date);
                if(evolution) {
                    nette_investis = nette_investis + Number(evolution.nette_investis);
                    rendement = rendement + Number(evolution.rendement);
                    valeur_portefeuille = valeur_portefeuille + Number(evolution.valeur_portefeuille);
                    hasData = true;
                };
            }

            if (hasData) {
                e['date'] = date;
                e['nette_investis'] = nette_investis;
                e['rendement'] = rendement;
                e['valeur_portefeuille'] = valeur_portefeuille;
                return e;
            }
            
            return null;
        }
        
        delete fonds.r_i        
        return response(res, 200, message, {periode: period, evolution_portefeuilles: evolutions});

    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllPortefeuilles,
    getUnactivePortefeuilles,
    getActivesPortefeuilles,
    getRejectedPortefeuilles,
    getOnePortefeuilleChart,
    getGlobalPortefeuilleChart
}