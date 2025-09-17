const response = require('../middlewares/response');
const Acteur = require('../models/Acteur');
const { Particulier } = require('../models/Client');
const CompteDepot = require('../models/CompteDepot');
const Fonds = require('../models/Fonds');
const Operation = require('../models/Operation');
const Portefeuille = require('../models/Portefeuille');
const TypeOperation = require('../models/TypeOperation');
const ValeurLiquidative = require('../models/ValeurLiquidative');
const Utils = require('../utils/utils.methods');
// const Operation = require("../models/Operation");
// const Acteur = require("../models/Acteur");
// const Session = require("../models/Session");
// const Utils = require("../utils/utils.methods");
// const Fonds = require('../models/Fonds');
// const { Particulier } = require('../models/Client');
// const Wave = require('../utils/wave.methods');
// const uuid = require('uuid');
// const OTP = require('../models/OTP');

const getAllTypeOperations = async (req, res, next) => {
    await TypeOperation.findAll()
        .then(typeop => response(res, 200, `Chargement des types d'opération`, typeop))
        .catch(err => next(err));
}

const getAllActeurOperations = async (req, res, next) => {
    console.log(`Chargement des opérations..`);
    const acteurId = req.session.e_acteur;
    await Operation.findAllByActeurId(acteurId).then(async operations => {
        for(let op of operations) {
            await TypeOperation.findById(op.e_type_operation).then(async top => {
                op['r_type_operation'] = top.r_intitule;
                delete op.r_i
                delete op.e_acteur
                delete op.e_type_operation
            })
        }
        return response(res, 200, `Liste des opérations`, operations);
    }).catch(err => next(err));
}

const opDepot = async (req, res, next) => {
    
    const acteurId = req.session.e_acteur;
    const {montant, mobile_payeur, callback_erreur, callback_succes} = req.body;
    
    Utils.expectedParameters({montant, mobile_payeur, callback_erreur, callback_succes}).then(async () => {
        
        if (isNaN(montant)) return response(res, 400, `Valeur numérique attendue pour le montant !`, {montant});
        const frais_operateur = Number(montant/100);
        const nv_montant = Number(montant) - frais_operateur;
        /**
         * Ecriture de la transaction, en attendant la confirmation de l'operateur (statut: 0 = en cours de traitement)
         */

        await TypeOperation.findByIntitule('depot').then(async type_operation => {
            await Operation.create(acteurId, type_operation.r_i, {
                reference_operateur: null, 
                libelle: "DEPOT - N° DE TRANSACTION: " + mobile_payeur, 
                montant: nv_montant, 
                frais_operation: 0, 
                frais_operateur: frais_operateur, 
                compte_paiement: mobile_payeur
            }).then(async operation => {
                console.log("Approvisionnement de compte de depot");
                
                operation['r_type_operation'] = type_operation.r_intitule;
                delete operation.r_i;
                delete operation.e_acteur;
                delete operation.e_type_operation;
                delete operation.r_date_modif;

                /**
                 * - Exécution de la transaction coté operateur, 
                 * - Suivi de la modification du statut par webhook (statut: 1 = ok et 2 = rejeté),
                 * - Avec impact sur le compte de depot.
                 */

                //--- à supprimer plutard ----------------------------------------------------------
                
                console.log(`Mise à jour du compte de dépôt`);
                
                await CompteDepot.findByActeurId(acteurId).then(async compte => {
                    if (!compte) return response(res, 404, `Compte de dépôt inexistant`);
                    console.log(`Début du dépôt sur compte de dépôt`);
                    const solde_disponible = compte.r_solde_disponible ? compte.r_solde_disponible : 0;
                    const newMontant = Number(solde_disponible) + Number(operation.r_montant);
                    console.log('solde disponible:', solde_disponible)
                    console.log('montant operation:', operation.r_montant)
                    await CompteDepot.mouvement(acteurId, {montant: newMontant}).then(async result => {
                        await Operation.updateSuccess(operation.r_reference).catch(err => next(err));
                        console.log(`Dépôt sur le compte termné`);
                        console.log('nouveau solde:', result.r_solde_disponible);
                        return response(res, 201, "Opération termné", operation);
                    }).catch(err => console.log(err));
                }).catch(err => next(err));

                //----------------------- ----------------------------------------------------------

            }).catch(err => next(err));
        }).catch(err => next(err));

    }).catch(err => response(res, 400, err));
}

const opSouscription = async (req, res, next) => {
    
    console.log(`Opération de souscription..`);
    
    const acteurId = req.session.e_acteur;
    const {fonds_code, montant} = req.body;

    Utils.expectedParameters({fonds_code, montant}).then(async () => {
        if (isNaN(montant)) return response(res, 400, `Valeur numérique attendue pour le montant de soucription !`, {montant});
        await Fonds.findByCode(fonds_code).then(async fonds => {
            if (!fonds) return response(res, 404, `Fonds indisponible !`);
            console.log(`Vérification de la valeur liquidative du fonds`);
            await ValeurLiquidative.findLastByFonds(fonds_code).then(async vl => {
                if (!vl) return response(res, 404, `Valeur liquidative indisponible !`)
                if (Number(montant) < Number(vl.r_valeur_courante)) return response(res, 400, `Le montant attendu est inférieur à la valeur liquidative actuelle !`);
                console.log(`Récupération des données utilisateur`);
                await Particulier.findByActeurId(acteurId).then(async particulier => {
                    if (!particulier) return response(res, 404, `Le compte utilisateur n'existe pas !`);
                    if (!particulier.r_ncompte_titre) return response(res, 400, `Ce compte n'est pas valide !`);
                    console.log(`Recherche du type d'opération`);
                    await TypeOperation.findByIntitule(`souscription`).then(async type_operation => {
                        if(!type_operation) return response(res, 404, `Type opération non trouvé !`);  
                        console.log(`Vérification du solde du compte de dépôt`);                    
                        await CompteDepot.findByActeurId(acteurId).then(async compte => {
                            if (!compte) return response(res, 404, `Le compte de dépôt est inexistant !`);
                            const solde_disponible = compte.r_solde_disponible;
                            if (Number(solde_disponible) < Number(montant)) return response(res, 400, `Le solde est dispobible est inférieur au montant de souscrition`);
                            const newMontant = Number(solde_disponible) - Number(montant);
                            console.log(`Débit du montant sur le compte de dépôt`);
                            await CompteDepot.mouvement(acteurId, {montant: newMontant}).then(async newCompte => {
                                console.log(`Enregistrement de l'opération`);
                                const commission = fonds.r_commission_souscription ? fonds.r_commission_souscription : 0;
                                await Operation.create(acteurId, type_operation.r_i, {
                                    reference_operateur: null, 
                                    libelle: "SOUSCRIPTION - N° DE TRANSACTION: " + particulier.r_ncompte_titre, 
                                    montant: montant, 
                                    frais_operation: commission, 
                                    frais_operateur: 0, 
                                    compte_paiement: particulier.r_ncompte_titre 
                                }).then(async operation => {
                                    if (!operation) return response(res, 400, `Une erreur s'est produite lors de la souscription !`);
                                    const cour = vl.r_valeur_courante;
                                    const part = (Number(operation.r_montant) - Number(operation.r_frais_operation))/Number(cour);
                                    const total = (part * cour);
                                    await Portefeuille.createPortefeuille(acteurId, operation.r_i, fonds.r_i, {
                                        cours_placement: cour, 
                                        nombre_parts: part, 
                                        valeur_placement: total
                                    }).then(async portefeuille => {
                                        portefeuille['r_intitule_fonds'] = fonds.r_intitule;
                                        delete portefeuille.r_i;
                                        delete portefeuille.e_acteur;
                                        delete portefeuille.e_fonds;
                                        delete portefeuille.e_operation;
                                        delete portefeuille.r_date_modif;
                                        return response(res, 201, `Soucription terminé`, portefeuille);
                                    }).catch(err => next(err));
                                }).catch(err => next(err));
                            }).catch(err => next(err));
                        }).catch(err => next(err));
                    }).catch(err => next(err));
                }).catch(err => next(err));
            }).catch(err => next(err));
        }).catch(err => next(err));                   
    }).catch(err => response(res, 400, err));

};

// const opSouscriptionCompleted = async (req, res, next) => {

//     console.log('Wenhook::Reponse de paiement wave..')
    
//     const apikey = req.apikey.r_valeur;
//     const {id, type, data} = req.body;

//     Utils.expectedParameters({id, type, data}).then(async () => {

//         if (type!="checkout.session.completed" || data.payment_status!="succeeded") return null;
        
//         console.log('Paiement wave réussi');
//         console.log(`Récupération des données de l'opération`);
//         await Operation.findByRef(data.client_reference).then(async operation => {
            
//             if (!operation) {
//                 await Wave.refund(data.id, async () => {});        
//                 console.error(`Données de l'opération introuvable !`);
//             }

//             const idClient = operation.compte_paiement;
//             const idFcp = operation.e_fonds;

//             if (operation.r_statut==1 || operation.r_statut==-1) { // Souscription déjà pris en compte
//                 console.log(`Souscription déjà traitée !`)
//                 return null;     
//             }

//             console.log(`Envoi des données de souscription à ATSGO..`);

//             await Atsgo.saveMouvement(apikey, {
//                 idTypeMouvement: 1,             // 1:Apport Liquidité - 2:Retrait de Liquidités
//                 idClient: idClient,
//                 idFcp: idFcp,
//                 date: new Date(),
//                 dateMouvement: data.when_created,
//                 dateValeur: data.when_completed,
//                 idModePaiement: 6,              // 6:wave
//                 refModePaiement: data.transaction_id,
//                 montant: operation.r_montant,
//                 libelle: operation.r_libelle
//             }, async (mouvement_data) => {
//                 await Atsgo.saveOperation(apikey, {
//                     idClient: idClient,
//                     idFcp: idFcp,
//                     referenceOperation: operation.r_reference, 
//                     idTypeOperation: 2,         // 2:Souscription - 3:Rachat
//                     libelle: operation.r_libelle, 
//                     dateValeur: data.when_created, 
//                     idModePaiement: 6,          // 6: Wave
//                     refModePaiement: data.transaction_id,
//                     montant: operation.r_montant
//                 }, async (operaton_data) => {
//                     await Operation.updateSuccess(operation.r_reference).then(async result => {
//                         await Acteur.findById(operation.e_acteur).then(acteur => {
//                             const notification = `Souscription:\nVotre demande à été soumise.\nNo.Opération: ${operaton_data}\nRef.Wave: ${data.id}\nMontant: ${operation.r_montant} ${data.currency}\nRef.Transaction: ${data.transaction_id}`;
//                             Utils.sendNotificationSMS(acteur.r_i, acteur.r_telephone_prp, notification, 3, () => {
//                                 console.log(`Opération de souscription envoyé avec succès`, { reference: result.r_reference });
//                             });
//                         }).catch(err => console.error(err))
//                     }).catch(err => console.error(err))
//                 }).catch(err => {
//                     Operation.updateFail(operation.r_reference).then(async result => {
//                         Wave.refund(data.id, () => { 
//                             Acteur.findById(operation.e_acteur).then(acteur => {
//                                 const notification = `Votre demande de souscription a échouée. Le Montant: ${operation.r_montant} ${data.currency}, de Ref.Wave: ${data.id}, à été restitué.\nRef.Transaction: ${data.transaction_id}`;
//                                 Utils.sendNotificationSMS(acteur.r_i, acteur.r_telephone_prp, notification, 3, () => {
//                                     console.log(`Opération de souscription échouée`, { reference: result.r_reference });
//                                 });
//                             }).catch(err => console.error(err)); 
//                         }); 
//                         console.error(err);
//                     }).catch(err => console.error(err))
//                 })
//             }).catch(err => {
//                 Operation.updateFail(operation.r_reference).then(async result => {
//                     Wave.refund(data.id, () => { 
//                         Acteur.findById(operation.e_acteur).then(acteur => {
//                             const notification = `Votre demande de souscription a échouée. Le Montant: ${operation.r_montant} ${data.currency}, de Ref.Wave: ${data.id}, à été restitué.\nRef.Transaction: ${data.transaction_id}`;
//                             Utils.sendNotificationSMS(acteur.r_i, acteur.r_telephone_prp, notification, 3, () => {
//                                 console.log(`Opération de souscription échouée`, { reference: operation.r_reference });
//                             });
//                         }).catch(err => console.error(err)); 
//                     }); 
//                     console.error(err);
//                 }).catch(err => console.error(err)); 
//             })
             
//         }).catch(err => console.error(err));
//     }).catch(err => console.error(err));
// };

const opRachat = async (req, res, next) => {

    console.log(`Opération de rachat..`);
    const op_code = 'TYOP-007';
    
    if (req.headers.op_code!=op_code) return response(res, 403, `Type opération non authorisé !`);
    
    const apikey = req.apikey.r_valeur;
    const {idFcp, montant, moyen_paiement} = req.body;
    const acteur_id = req.session.e_acteur;

    Utils.expectedParameters({idFcp, montant}).then(async () => {
        
        console.log(`Recupération des données client`)
        await Acteur.findById(acteur_id).then(async acteur => {
            await Particulier.findById(acteur.e_particulier).then(async particulier => {
                
                await TypeOperation.findByCode(op_code).then(async type_operation => {
                    if(!type_operation) return response(res, 404, `Type opération non trouvé !`);

                    const op_ref = uuid.v4();
                    const libelle = `RACHAT FCP BRIDGE - N° DE TRANSACTION: `
                    const date = new Date();
                    // const idClient = particulier.r_ncompte_titre;
                    const idClient = particulier.r_atsgo_id_client;

                    console.log(`Enregistrement de mouvement..`)

                    await Atsgo.saveOperation(apikey, {
                        idFcp, 
                        idClient, 
                        referenceOperation: op_ref, 
                        idTypeOperation: 3,             // 2:Souscription - 3:Rachat
                        libelle: "RETRAIT DE FONDS DE PLACEMENT", 
                        dateValeur: date, 
                        idModePaiement: 7,              // 7: Paiement espece
                        refModePaiement: "TMOP-002",
                        montant: montant
                    }, async (operaton_data) => {
                        await Atsgo.saveMouvement(apikey, {
                            idTypeMouvement: 2,         // 1:Apport Liquidité - 2:Retrait de Liquidités
                            idClient,
                            idFcp,
                            date: date,
                            dateMouvement: date,
                            dateValeur: date,
                            idModePaiement: 7,          // 7: Paiement espece
                            refModePaiement: "TMOP-002",
                            montant: montant,
                            libelle: libelle
                        }, async (mouvement_data) => {

                            await Operation.create(acteur_id, type_operation.r_i, { 
                                reference_operateur: "", 
                                libelle: libelle, 
                                montant: montant, 
                                frais_operateur: null, 
                                frais_operation: null, 
                                compte_paiement: idClient
                            }).then(async operation => {
                                if (!operation) return response(res, 400, `Initialisation de paiement échoué !`);

                                const notification = `Demande de rachat:\nVotre demande à été soumise.\nNo.Opération:${operaton_data}\nMontant: ${montant}XOF\nRef.Operation: ${operation.r_reference}`;
                                Utils.sendNotificationSMS(acteur.r_i, acteur.r_telephone_prp, notification, 3, () => {
                                    console.log(`Opération de rachat envoyé avec succès`, { reference: operation.r_reference });
                                });

                            }).catch(err => next(err));

                            const data = {
                                idOperation: mouvement_data,
                                moyen_paiement: "TMOP-002",
                                montant: montant,
                                devise: "XOF",
                                date_creation: date
                            }

                            return response(res, 200, `Operation de rachat en cours de traitement`, data);

                        }).catch(err => next(err));
                    }).catch(err => next(err));
                }).catch(err => next(err));
            }).catch(err => next(err));
        }).catch(err => next(err));
    }).catch(err => response(res, 400, err));
};

const opTransfert = async (req, res, next) => {
    console.log(`Opération de transfert..`);
    if (req.headers.op_code!='TYOP-008') return response(res, 403, `Type opération non authorisé !`);
    // Utils.selectTypeOperation('transfert').then(async op_code => {
    //     saveOparation('TYOP-008', req, res, next);
    // }).catch(err => response(res, 400, err));
};

// async function saveAtsgoOperation(type, acteur_id, {apikey, idFcp, libelle, montant, res, next}) {

//     console.log(`Recupération des données client`)
//     await Acteur.findById(acteur_id).then(async acteur => {
//         await Particulier.findById(acteur.e_particulier).then(async particulier => {
            
//             const date = new Date();
//             // const idClient = particulier.r_ncompte_titre;
//             const idClient = particulier.r_atsgo_id_client;
            
//             console.log(`Envoi de l'operation à ATSGO`);

//             Atsgo.saveOperation(apikey, {
//                 idFcp, 
//                 idClient, 
//                 referenceOperation: "string", 
//                 idTypeOperation: 2, 
//                 libelle, 
//                 dateValeur: date, 
//                 idModePaiement: 2, 
//                 montant
//             }).then(async () => {
//                 return response(res, 200, `Operation de ${type} terminé`);
//             }).catch(err => next(err));

//         }).catch(err => next(err));
//     }).catch(err => next(err));

// }

// async function saveOparation (op_code, req, res, next) {
//     /**
//      * [x] Vérification des paramètres
//      * [x] Chargement de la session pour en deduire le ID de l'acteur
//      * [x] Chargement du type opération correspondant à l'opération 
//      *     [x] Vérifier si le type opération est soumis ou non à un circuit de validation
//      *         Si oui : 
//      *         -[x] Status de l'opération = 0
//      *         -[x] Récuperer les étapes de validation, pour en déduire les acteur cible
//      *         -[x] Créer une entrer pour chaque acteur dans la table affectation
//      *     [x] Si non : Status de l'opération = 1 (opération valide d'emblé)
//      * [x] Chargement du moyen de paiement de l'acteur
//      * [x] Chargement de FCP
//      * [x] Enregistrement de l'opération
//      */

//     console.log(`Création d'opération..`);
//     const {session_ref, reference_operateur, libelle, montant, frais_operation, frais_operateur, moyen_paiement, compte_paiement, fonds_ref} = req.body;
//     console.log(`Vérification des paramètres`);
//     Utils.expectedParameters({session_ref, reference_operateur, libelle, montant, frais_operation, frais_operateur, moyen_paiement, compte_paiement, fonds_ref}).then( async () => {
//         console.log('Chargement de la session');
//         await Session.findByRef(session_ref).then(async session => {
//             // console.log(`Chargement du type opération`);
//             // Utils.selectTypeOperation(req.params.op).then(async op_code => {
//                 await TypeOperation.findByCode(op_code).then(async type_operation => {
//                     if(!type_operation) return response(res, 404, `Type opération non trouvé !`);
//                     console.log(`Chargement de moyen de paiment`)
//                     await MoyenPaiementActeur.findById(moyen_paiement).then(async moypaiement => {
//                         if (!moypaiement) return response(res, 404, `Moyen de paiement non trouvé !`);
//                         console.log(`Chargement du FCP`);
//                         await Fonds.findByRef(fonds_ref).then(async fonds => {
//                             if (!fonds) return response(res, 404, `Ce FCP est inconnu !`);
//                             console.log(`Vérification des circuits de validation`);
//                             await CircuitValidation.findAllByTypeOperation(type_operation.r_i).then(async circuit => {
//                                 let status = 1;        // Soumis à aucun circuit de validation
//                                 if (circuit) {
//                                     console.log(`Le type opération est soumis à un circuit de validation`)
//                                     // status = 0;
//                                 } console.log(`Enregistrement de l'opération`);
//                                 await Operation.create(session.e_acteur, type_operation.r_i, moypaiement.r_i, fonds.r_i, uuid.v4(), {...req.body}).then(async operation => {
//                                     if (!operation) return response(res, 400, `Une erreur s'est produit !`);
//                                     console.log(`Chargement des étapes du circuit`);
//                                     if (status==0) {
//                                         await CircuitEtape.findAllByCircuitId(circuit.r_i).then(async etapes => {
//                                             if (etapes.length==0) return response(res, 400, `Aucune étape de validation trouvé`);
//                                             try {
//                                                 AffectationPanierValidation(etapes, operation);
//                                             } catch (error) {
//                                                 console.log(error);
//                                                 return response(res, 400, error);
//                                             }
//                                         }).catch(err => next(err));
//                                     }
//                                     return response(res, 201, `Enregistrement de l'opération terminé`, operation);
//                                 }).catch(err => next(err));
//                             }).catch(err => next(err));
//                         }).catch(err => next(err));
//                     }).catch(err => next(err));
//                 }).catch(err => next(err));
//             // }).catch(err => response(res, 400, err));
//         }).catch(err => response(res, 400, err));
//     }).catch(err => response(res, 400, err));
// }

// async function AffectationPanierValidation(etapes, operation) {

//     console.log(`Affectation au panier de validation`);

//     for(let etape of etapes) {
//         console.log(etape)
//         console.log(`Vérificartion du type de l'étape`);
//         if (etape.r_type==1) {  // 1:Validation sur profil
//             console.log('Vérification du profil')
//             if (etape.e_profil!=0) {
//                 await Acteur.findAllByProfil(etape.e_profil).then(async acteurs => {
//                     console.log(`Vérification des acteurs`)
//                     if (acteurs.length==0) throw "Une erreur s'es produite à l'affectation de l'acteur";
//                     for(let acteur of acteurs) {
//                         console.log(`Affectation à l'acteur`, acteur.r_i);
//                         await CircuitAffectation.create(etape.e_circuit_validation, operation.r_i, acteur.r_i).then(affectation => {
//                             if (!affectation) throw "Une erreur s'es produite à l'affectation de l'acteur";
//                         }).catch(err => next(err));
//                     }
//                 }).catch(err => next(err));
//             }
//         } 
//         if (etape.r_type==2) {  // 2:Validation par un type acteur
//             console.log(`Vérificartion du type de l'étape`);
//             if (etape.e_type_acteur!=0) {
//                 console.log('Vérification du type acteur')
//                 await Acteur.findAllByTypeActeur(etape.e_type_acteur).then(async acteurs => {
//                     if (acteurs.length==0) throw "Une erreur s'es produite à l'affectation de l'acteur";
//                     for(let acteur of acteurs) {
//                         console.log(`Affectation à l'acteur`, acteur.r_i);
//                         await CircuitAffectation.create(etape.e_circuit_validation, operation.r_i, acteur.r_i).then(affectation => {
//                             if (!affectation) throw "Une erreur s'es produite à l'affectation de l'acteur";
//                         }).catch(err => next(err));
//                     }
//                 }).catch(err => next(err));
//             }
//         }
//         if (etape.r_type==3) {  // 3: Validation par un acteur
//             console.log(`Vérificartion du type de l'étape`);
//             if (etape.e_acteur!=0) {
//                 console.log(`Affectation à l'acteur`, etape.e_acteur);
//                 await CircuitAffectation.create(etape.e_circuit_validation, operation.r_i, etape.e_acteur).then(affectation => {
//                     if (!affectation) throw "Une erreur s'es produite à l'affectation de l'acteur";
//                 }).catch(err => next(err));
//             }
//         }
//     }
// }

module.exports = {
    getAllTypeOperations,
    // getOneOperation,
    getAllActeurOperations,
    opSouscription,
    opRachat,
    // opSouscriptionCompleted,
    opDepot,
    opTransfert
    // saveOparation
}