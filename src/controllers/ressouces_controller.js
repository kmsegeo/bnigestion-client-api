const response = require('../middlewares/response');
const Client = require('../models/Client');

const getAllTypeActeurs = async (req, res, next) => {
    console.log(`Récupération des types acteur..`);
    await Client.TypeActeur.findAll()
        .then(types => response(res, 200, `Liste des acteurs`, types))
        .catch(error => next(error));
}

const getLanguePreferee = async (req, res, next) => {
    
    const langue = [
        {id: 1, intitule: "Français"},
        {id: 2, intitule: "Anglais"},
    ]
    return response(res, 200, 'Liste des categorie compte', langue)
}

// const getCivilite = async (req, res, next) => {
    
//     const civilite = [
//         {id: 1, intitule: "Monsieur"},
//         {id: 2, intitule: "Madame"},
//         {id: 3, intitule: "Mlle"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', civilite)
// }

// const getTypeCompte = async (req, res, next) => {
    
//     const type_compte = [
//         {id: 1, intitule: "Compte Individuel"},
//         {id: 2, intitule: "Compte indivis"},
//         {id: 3, intitule: "Compte conjoint"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', type_compte)
// }

// const getContexteOuvertureCompte = async (req, res, next) => {
    
//     const contexte = [
//         {id: 1, intitule: "spontanée"},
//         {id: 2, intitule: "Recommandation"},
//         {id: 3, intitule: "Apporteur d'affaires"},
//         {id: 4, intitule: "Autres (préciser)"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', contexte)
// }

// const getOuvertureCompte = async (req, res, next) => {
//     const ouverture = [ {id: 1, intitule: "A distance"}, {id: 2, intitule: "En présentiel"}]
//     return response(res, 200, 'Liste des categorie compte', ouverture)
// }

// const getSituationMatrimoniale = async (req, res, next) => {
    
//     const matrimonial = [
//         {id: 1, intitule: "Célibataire"},
//         {id: 2, intitule: "Marié"},
//         {id: 3, intitule: "Conjoint de fait"},
//         {id: 4, intitule: "Veuf"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', matrimonial)
// }

// const getSituationHabitat = async (req, res, next) => {
    
//     const habitat = [
//         {id: 1, intitule: "locataire"},
//         {id: 2, intitule: "co-propriétaire"},
//         {id: 3, intitule: "propriétaire"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', habitat)
// }

// const getCategorieProfessionnelle = async (req, res, next) => {
    
//     const habitat = [
//         {id: 1, intitule: "Salarié privée"},
//         {id: 2, intitule: "Fonctionnaire"},
//         {id: 3, intitule: "Fonctionnaire internationale"},
//         {id: 4, intitule: "Retraité"},
//         {id: 5, intitule: "Profession libérale"},
//         {id: 6, intitule: "Entrepreneur"},
//         {id: 7, intitule: "Autres (préciser)"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', habitat)
// }

// const getOrigineRessourcesInvesties = async (req, res, next) => {
    
//     const origine = [
//         {id: 1, intitule: "Salaire"},
//         {id: 2, intitule: "Pension"},
//         {id: 3, intitule: "Bénéfice"},
//         {id: 4, intitule: "Autres (préciser)"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', origine)
// }

// const getTrancheRevenus = async (req, res, next) => {
    
//     const tranche = [
//         {id: 1, intitule: "<500 000"},
//         {id: 2, intitule: "500 000 - 2 000 000"},
//         {id: 3, intitule: ">2 000 000"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', tranche)
// }

// const getAutresActifs = async (req, res, next) => {
    
//     const autreActifs = [
//         {id: 1, intitule: "Biens immobiliers"},
//         {id: 2, intitule: "Titres de participation"},
//         {id: 3, intitule: "Titres de créances"},
//         {id: 4, intitule: "Pars d'OPC"},
//         {id: 5, intitule: "Autres (préciser)"},
//     ]
//     return response(res, 200, 'Liste des categorie compte', autreActifs)
// }

// const getCategorieCompte = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_CATEGORIE_COMPTE + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des categories compte !`, data.title)
//         return response(res, 200, 'Liste des categorie compte', data.payLoad)
//     }).catch(err => next(err));
// }

// const getCategorieClient = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_CATEGORIE_CLIENT + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des categories client !`, data.title)
//         return response(res, 200, 'Liste des categorie client', data.payLoad)
//     }).catch(err => next(err));
// }

// const getCategorieFatca = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_CATEGORIE_FATCA + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des categories FATCA !`, data.title)
//         return response(res, 200, 'Liste des categorie FATCA', data.payLoad)
//     }).catch(err => next(err));
// }

// const getTypeClient = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_TYPE_CLIENT + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des types de client !`, data.title)
//         return response(res, 200, 'Liste des type de clients', data.payLoad)
//     }).catch(err => next(err));
// }

// const getTypeCompteInvest = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_TYPE_COMPTE + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des types de compte !`, data.title)
//         return response(res, 200, 'Liste des type de compte', data.payLoad)
//     }).catch(err => next(err));
// }

// const getTypePiece = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_TYPE_PIECE + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des types de pièce !`, data.title)
//         return response(res, 200, 'Liste des type de pièce', data.payLoad)
//     }).catch(err => next(err));
// }

// const getPays = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_PAYS + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des pays !`, data.title)
//         return response(res, 200, 'Liste des pays', data.payLoad)
//     }).catch(err => next(err));
// }

// const getOrigineRevenu = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_ORIGINE_REVENU + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des origines de revenu !`, data.title)
//         return response(res, 200, 'Liste des origines de revenu', data.payLoad)
//     }).catch(err => next(err));
// }

// const getSecteurActivite = async (req, res, next) => {
//     const apikey = req.apikey.r_valeur;
//     const url = process.env.ATSGO_URL + process.env.URI_SECTEUR_ACTIVITE + '?ApiKey=' + apikey;
//     await fetch(url).then(async res => res.json()).then(async data => {
//         if (data.status!=200) return response(res, 403, `Une erreur lors de la récupération des secteurs d'activité !`, data.title)
//         return response(res, 200, 'Liste des secteurs d\'activité', data.payLoad)
//     }).catch(err => next(err));
// }

module.exports = {
    getAllTypeActeurs,
    getLanguePreferee,
    // getCivilite,
    // getTypeCompte,
    // getContexteOuvertureCompte,
    // getOuvertureCompte,
    // getSituationMatrimoniale,
    // getSituationHabitat,
    // getCategorieProfessionnelle,
    // getOrigineRessourcesInvesties,
    // getTrancheRevenus,
    // getAutresActifs,
    // getCategorieCompte,
    // getCategorieClient,
    // getCategorieFatca,
    // getTypeClient,
    // getTypeCompteInvest,
    // getTypePiece,
    // getPays,
    // getOrigineRevenu,
    // getSecteurActivite
}