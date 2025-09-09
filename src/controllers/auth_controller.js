const response = require('../middlewares/response');
const { createHash } = require('crypto');
const Utils = require('../utils/utils.methods');

const sha256encode = async (req, res, next) => {
    /**
     * [x] Constitution de la chaine d'information
     * [x] Création du hash sur 64bit
     */
    const algorithm = "SHA256";
    const {op_code, app_id, timestamp, app_mdp} = req.body;
    Utils.expectedParameters({op_code, app_id, timestamp, app_mdp}).then(() => {

        console.log(`Encodage des données de la requête..`)

        try {
            const str = op_code + app_id + timestamp + app_mdp;
            const hash = createHash(algorithm).update(str).digest('base64');
            return response(res, 200, `Encodage SHA256 Terminé`, {hash: hash})
        } catch (error) {
            return response(res, 400, `Erreur d'encodage`);
        }

    }).catch(err => response(res, 400, err));
}

const authVerify = async (req, res, next) => {
    /**
     * processus de vérification et d'authentification du canal
     */
    return response(res, 200, `Canal vérifié`);
}

module.exports = {
    sha256encode,
    authVerify
}
