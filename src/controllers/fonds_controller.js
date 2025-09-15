const response = require("../middlewares/response");
const Fonds = require("../models/Fonds");
const ValeurLiquidative = require("../models/ValeurLiquidative");

const getAllFonds = async (req, res, next) => {
    console.log("Récupération de la liste des fonds...");
    await Fonds.findAll().then(async fonds => {
        for (let f of fonds) {
            await ValeurLiquidative.findLastByFonds(f.r_code).then(vl => {
                f['vl'] = vl;
            }).catch(err=>next(err));
        }
        return response(res, 200, "Liste des fonds", fonds)
    }).catch(err => next(err));
}

const getOneFonds = async (req, res, next) => { 
    const code = req.params.code;
    console.log("Récupération du fonds " + code + "...");
    await Fonds.findByCode(code).then(async fonds => {
        if (!fonds) return response(res, 404, "Fonds non trouvé", null);
        await ValeurLiquidative.findLastByFonds(fonds.r_code).then(vl => {
            fonds['vl'] = vl;
            delete fonds.r_i;
            return response(res, 200, "Détails du fonds", fonds)
        }).catch(err=>next(err));
    }).catch(err => next(err));
}


module.exports = {
    getAllFonds,
    getOneFonds    
}