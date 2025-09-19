const default_data = require('../config/default_data');
const response = require('../middlewares/response');
const Fonds = require('../models/Fonds');
const Portefeuille = require('../models/Portefeuille');
const ValeurLiquidative = require('../models/ValeurLiquidative');

const portefeuille_statuts = default_data.portefeuille_statuts

const getAllPortefeuilles = async (req, res, next) => {

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;
    try {

        let analyse_gobal = [];

        const portefeuilles = await Portefeuille.findActivesByActeurId(acteurId);
        const fonds = await Fonds.findAll();
        
        for (let f of fonds) {

            let portefeuille = {}

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

                    p['r_intitule_fonds'] = f.r_intitule
                    p['r_statut'] = portefeuille_statuts[p.r_statut];
                    
                    parts = Number(parts) + Number(p.r_nombre_parts);
                    cours = Number(cours) + Number(p.r_cours_placement);
                    total = Number(total) + Number(p.r_montant_placement);

                    cpt +=1;

                    delete p.r_i;
                    delete p.e_fonds;
                    delete p.e_acteur;
                    delete p.e_operation;
                }
            }

            rendement = ((Number(vl.r_valeur_courante) * parts) - total);
            taux = (rendement/total)*100
            valeur = total + rendement;

            portefeuille['intitule_fonds'] = f.r_intitule;
            portefeuille['nombre_parts'] = Number(parts.toFixed(2))
            portefeuille['valeur_liquidative'] = Number(vl.r_valeur_courante);
            portefeuille['cours_moy_placement'] = Number(cours/cpt);
            portefeuille['total_placement'] = total;
            portefeuille['rendement_total'] = Number(rendement.toFixed(2));
            portefeuille['taux_rendement'] = Number(taux.toFixed(2));
            portefeuille['valeur_placement'] = Number(valeur.toFixed(2));

            analyse_gobal.push(portefeuille)
        }
        return response(res, 200, 'Liste des portefeuilles', portefeuilles, analyse_gobal);
    } catch (error) {
        next(error);
    }
}

const getUnactivePortefeuilles = async (req, res, next) => {

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
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

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
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

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
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

module.exports = {
    getAllPortefeuilles,
    getUnactivePortefeuilles,
    getActivesPortefeuilles,
    getRejectedPortefeuilles
}