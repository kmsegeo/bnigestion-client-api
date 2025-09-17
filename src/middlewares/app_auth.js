const response = require("./response");
const Canal = require('../models/Canal');
const TypeOperation = require('../models/TypeOperation');
const crypto = require('crypto');
const Encryption = require("../utils/encryption.methods");

module.exports = async (req, res, next) => {

    try {
        console.log(`Authentification de la requête..`);
        const app_hash = req.headers.appauth;
        const req_hash = await appVerifyer(req.headers.app_id, req.headers.op_code, req.headers.timestamp)
        if (app_hash!=req_hash) 
            throw `Authentification de la requête à échoué !`; 
        console.log(`Authentification réussi`); 
        next(); 
    } catch(error) {
        return response(res, 401, error);
    }
}

async function appVerifyer(app_id, op_code, timestamp) {

    let canal = null; 

    console.log("application:", app_id);
    console.log("code:", op_code);

    await Canal.findByCode(app_id).then(async result => {
        if (!result) throw `Canal introuvable !`;
        canal = result;
    }).catch(err => { throw err });

    await TypeOperation.findByCode(op_code).then(async type_operation => {
        if (!type_operation) throw `Erreur de code opération`;
    }).catch(err => { throw err });

    const app_mdp = await Encryption.decrypt(canal.r_pass);
    return crypto.createHash("SHA256").update(op_code + app_id + timestamp + app_mdp).digest('base64');
}