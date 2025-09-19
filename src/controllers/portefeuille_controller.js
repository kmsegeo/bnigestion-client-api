const default_data = require('../config/default_data');
const response = require('../middlewares/response');
const Fonds = require('../models/Fonds');
const Portefeuille = require('../models/Portefeuille');

const portefeuille_statuts = default_data.portefeuille_statuts

const getAllPortefeuilles = async (req, res, next) => {

    /**
     * [x] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
    console.log(`Chargement des portefeuilles du client..`);    
    const acteurId = req.session.e_acteur;
    try {
        const portefeuilles = await Portefeuille.findAllByActeurId(acteurId);
        for(let p of portefeuilles) {
            let fonds = await Fonds.findById(p.e_fonds);
            p['r_intitule_fonds'] = fonds.r_intitule
            p['r_statut'] = portefeuille_statuts[p.r_statut];
            delete p.r_i;
            delete p.e_fonds;
            delete p.e_acteur;
            delete p.e_operation;
        }
        return response(res, 200, 'Liste des portefeuilles', portefeuilles, null);
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