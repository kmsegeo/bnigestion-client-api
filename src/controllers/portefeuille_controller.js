const response = require('../middlewares/response');
const Portefeuille = require('../models/Portefeuille');

const getLastPortefeuilles = async (req, res, next) => {

    /**
     * [] Charger les differents portefeuilles par fonds
     * [] Afficher la valeur totale des portefeuilles
     */
    
    try {
        const portefeuilles = await Portefeuille.findLastByFonds();
        return response(res, 200, 'Liste des portefeuilles', portefeuilles);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getLastPortefeuilles
}