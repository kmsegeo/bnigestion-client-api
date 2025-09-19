const response = require("../middlewares/response");
const Fonds = require("../models/Fonds");
const ValeurLiquidative = require("../models/ValeurLiquidative");

const getAllFonds = async (req, res, next) => {
    console.log("Récupération de la liste des fonds...");
    await Fonds.findAll().then(async fonds => {
        for (let f of fonds) {
            await ValeurLiquidative.findLastByFonds(f.r_code).then(vl => {
                f["r_valeur_liquidative"] = vl.r_valeur_courante,
                f["r_datevl"] = vl.r_datevl,
                f["r_valeur_precedente"] = vl.r_valeur_precedente,
                f["r_date_precedente"] = vl.r_date_precedente,
                f["r_taux_redement"] = vl.r_taux_redement,
                f["r_rendement_positive"] = vl.r_rendement_positive
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
            fonds["r_valeur_liquidative"] = vl.r_valeur_courante,
            fonds["r_datevl"] = vl.r_datevl,
            fonds["r_valeur_precedente"] = vl.r_valeur_precedente,
            fonds["r_date_precedente"] = vl.r_date_precedente
            fonds["r_taux_redement"] = vl.r_taux_redement,
            fonds["r_rendement_positive"] = vl.r_rendement_positive
            delete fonds.r_i;
            return response(res, 200, "Détails du fonds", fonds)
        }).catch(err=>next(err));
    }).catch(err => next(err));
}

const getAllVlsByFonds = async (req, res, next) => { 
    const code = req.params.code;
    console.log("Récupération du fonds " + code + "...");
    await Fonds.findByCode(code).then(async fonds => {
        if (!fonds) return response(res, 404, "Fonds non trouvé", null);
        await ValeurLiquidative.findAllByFonds(code).then(vls => {
            fonds['vls'] = vls;
            delete fonds.r_i;
            return response(res, 200, "Détails du fonds", fonds)
        }).catch(err=>next(err));
    }).catch(err => next(err));
}


module.exports = {
    getAllFonds,
    getOneFonds,
    getAllVlsByFonds
}