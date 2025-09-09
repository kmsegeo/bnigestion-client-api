const Session = require('../models/Session');
const response = require("./response");
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {

    try {
        console.log(`Authentification utilisateur..`);
        let decodedToken = null;
        
        try {

            const token = req.headers.authorization.split(' ')[1];
            decodedToken = jwt.verify(token, process.env.SESSION_KEY);

        } catch (error) {

            if (error.name=='TokenExpiredError') 
                throw "Token expiré !"

            if (error.name=='JsonWebTokenError') 
                throw "Token invalide !"

            throw error;
        } 
        
        console.log(`Vérification de session`)
        await Session.findByRef(decodedToken.session).then(session => {
            if (!session) throw `Erreur de session !`;
            if (session.r_statut==0) throw `Session inactive, connexion requise !`;
            console.log(`Session active !`);
            req.session = session;
            next();
        }).catch(error => response(res, 401, error));
        
    } catch (error) {
        return response(res, 401, error);
    }
}
