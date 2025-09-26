const response = require('../middlewares/response');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const default_data = require('../config/default_data');
const Acteur = require('../models/Acteur');
const { Particulier } = require('../models/Client');
const CompteDepot = require('../models/CompteDepot');
const Fonds = require('../models/Fonds');
const Operation = require('../models/Operation');
const Portefeuille = require('../models/Portefeuille');
const TypeOperation = require('../models/TypeOperation');
const ValeurLiquidative = require('../models/ValeurLiquidative');
const Utils = require('../utils/utils.methods');


const operation_statuts = default_data.operation_statuts;
const portefeuille_statuts = default_data.portefeuille_statuts

const getAllTypeOperations = async (req, res, next) => {
    await TypeOperation.findAll()
        .then(typeop => response(res, 200, `Chargement des types d'opération`, typeop))
        .catch(err => next(err));
}

const getAllActeurOperations = async (req, res, next) => {
   
    console.log(`Chargement des opérations..`);
    const acteurId = req.session.e_acteur;

    try {

        const operations = await Operation.findAllByActeurId(acteurId);
        const portefeuilles = await Portefeuille.findAllByActeurId(acteurId);
        const type_operations = await TypeOperation.findAll();
        const fonds = await Fonds.findAll();

        for(let op of operations) {
            for(let tyop of type_operations) {

                for (let p of portefeuilles) {
                    if (op.r_i==p.e_operation) {
                        for(f of fonds) {
                            if (f.r_i==p.e_fonds) {
                                op['r_intitule_fonds'] = f.r_intitule;
                                op['r_type_fonds'] = f.r_type;
                            }
                        }
                        op['r_valeur_liquidative'] = p.r_cours_placement;
                    }
                }
                
                if (op.e_type_operation==tyop.r_i) {
                    op['r_type_operation'] = tyop.r_intitule;
                    op['r_statut'] = operation_statuts[op.r_statut];
                    delete op.r_i
                    delete op.e_acteur
                    delete op.e_type_operation
                }
            }
        }
        
        return response(res, 200, `Liste des opérations`, operations);

    } catch (error) {
        next(error);
    }
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
                operation['r_statut'] = operation_statuts[operation.r_statut];

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
    const {code_fonds, montant} = req.body;

    Utils.expectedParameters({code_fonds, montant}).then(async () => {
        if (isNaN(montant)) return response(res, 400, `Valeur numérique attendue pour le montant de soucription !`, {montant});
        await Fonds.findByCode(code_fonds).then(async fonds => {
            if (!fonds) return response(res, 404, `Fonds indisponible !`);
            console.log(`Vérification de la valeur liquidative du fonds`);
            await ValeurLiquidative.findLastByFonds(code_fonds).then(async vl => {
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
                                        nombre_parts: part.toFixed(2), 
                                        valeur_placement: total
                                    }).then(async portefeuille => {
                                        portefeuille['r_intitule_fonds'] = fonds.r_intitule;
                                        portefeuille['r_statut'] = portefeuille_statuts[portefeuille.r_statut];
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

const opRachat = async (req, res, next) => {

    console.log(`Opération de rachat..`);

    const acteurId = req.session.e_acteur;
    const {code_fonds, montant} = req.body;

    Utils.expectedParameters({code_fonds, montant}).then(async () => {
        if (isNaN(montant)) return response(res, 400, `Valeur numérique attendue pour le montant de soucription !`, {montant});
        await Fonds.findByCode(code_fonds).then(async fonds => {
            if (!fonds) return response(res, 404, `Fonds indisponible !`);
            console.log(`Vérification de la valeur liquidative du fonds`);
            await ValeurLiquidative.findLastByFonds(code_fonds).then(async vl => {
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
                                        portefeuille['r_statut'] = portefeuille_statuts[portefeuille.r_statut];
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

const exportActeurOperation = async (req, res, next) => {

    console.log("Génération du fichier PDF des opération...");
    
    const dateDebut = req.params.debut;
    const dateFin = req.params.fin;
    const acteurId = req.session.e_acteur;
    
    try {

        let selectedPages =  [1, 2];

        const acteur = await Acteur.findById(acteurId);
        const client = await Particulier.findByActeurId(acteurId);

        const fonds = await Fonds.findAll();
        const portefeuilles = await Portefeuille.findAllByActeurId(acteurId);
        const operations = await Operation.findAllByActeurId(acteurId);
        const comptedepot = await CompteDepot.findByActeurId(acteurId);

        // for (let f of fonds) {
        //     let isFound = false;
        //     for (let p of portefeuilles)
        //         if (f.r_i==p.e_fonds) isFound = true;
        //     if (isFound) selectedPages.push(1);
        // }

        // Charger le PDF source

        const pdfPath = path.join(__dirname, '../files', 'RELEVE_FCP_MODEL.pdf');
        if (!fs.existsSync(pdfPath)) return response(res, 404, "Le fichier PDF source est introuvable.");
        
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const outputPdf = await PDFDocument.create();

        // Copier uniquement les pages sélectionnées
        const totalPages = pdfDoc.getPageCount();

        const pagesToKeep = selectedPages.length > 0
        ? selectedPages.filter(n => n >= 1 && n <= totalPages).map(n => n - 1) // 0-based
        : [...Array(totalPages).keys()]; // tout garder si rien spécifié

        for (const pageIndex of pagesToKeep) {
            const [copiedPage] = await outputPdf.copyPages(pdfDoc, [pageIndex]);
            outputPdf.addPage(copiedPage);
        }
        
        const helvetica = await outputPdf.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await outputPdf.embedFont(StandardFonts.HelveticaBold);

        const fontSize = 10;
        const fillcolor = rgb(0, 0, 0);
        
        const today = new Date(); 

        function drawRightAligned(page, rightMargin, positionY, text, fontSize, font, fillcolor) {
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const xPosition = rightMargin - textWidth;
            page.drawText(text, { x: xPosition, y: positionY, size: fontSize, font, color: fillcolor});
        }

        // ✍️ Écriture à des positions arbitraires (à ajuster selon le PDF)

        const pages = outputPdf.getPages();
        
        /* [PAGE i] */

        let curPage = pages[0];

        /* ENETE DE RELEVE */
        curPage.drawText(`${acteur?.r_nom_complet}`, {x: 282, y: 708, size: fontSize, font: helvetica, color: fillcolor});
        curPage.drawText(`${acteur?.r_adresse}`, {x: 282, y: 690, size: fontSize, font: helvetica, color: fillcolor});
        curPage.drawText(`ABIDJAN`, {x: 282, y: 673, size: fontSize, font: helvetica, color: fillcolor});
        curPage.drawText(`Compte N° : ${client?.r_ncompte_titre}`, {x: 282, y: 650, size: fontSize, font: helveticaBold, color: fillcolor});
        curPage.drawText(new Date(dateFin).toLocaleDateString(), {x: 282, y: 600, size: 11, font: helveticaBold, color: fillcolor});
        
        let global_portefeuille = 0;

        let pos = 478;
        let pas = 16;

        let i = 0;
        for (let f of fonds) {

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
                    if (p.r_statut==1) {
                        parts = Number(parts) + Number(p.r_nombre_parts);
                        cours = Number(cours) + Number(p.r_cours_placement);
                        total = Number(total) + Number(p.r_montant_placement);
                        cpt +=1;
                    }
                }
            }

            rendement = ((Number(vl.r_valeur_courante) * parts) - total);
            taux = (rendement/total)*100;
            valeur = total + rendement;

            let total_placement = total.toFixed(2);
            let nombre_parts = parts.toFixed(2);
            let valeur_liquidative = Number(vl.r_valeur_courante);
            let cours_moy_placement = (cours/cpt).toFixed(2);
            let rendement_total = rendement.toFixed(2);
            let taux_rendement = taux.toFixed(2);
            let valeur_placement = Number(valeur.toFixed(2)); 
            
            /* RECAP. DE FONDS */
            curPage.drawText(new Date(dateFin).toLocaleDateString(), {x: 358, y: 529, size: 10, font: helvetica, color: fillcolor});

            /* Calcule des valeurs du portefeuille */
            curPage.drawText(f.r_intitule, {x: 50, y: pos, size: fontSize, font: helvetica, color: fillcolor});
            drawRightAligned(curPage, 263, pos, `${nombre_parts}`, fontSize, helvetica, fillcolor);
            drawRightAligned(curPage, 319, pos, `${valeur_liquidative}`, fontSize, helvetica, fillcolor);
            drawRightAligned(curPage, 375, pos, `${cours_moy_placement}`, fontSize, helvetica, fillcolor);
            drawRightAligned(curPage, 432, pos, `${rendement_total}`, fontSize, helvetica, fillcolor);
            drawRightAligned(curPage, 493, pos, `${taux_rendement}`, fontSize, helvetica, fillcolor);
            drawRightAligned(curPage, 550, pos, `${valeur_placement}`, fontSize, helveticaBold, fillcolor);

            global_portefeuille = global_portefeuille + Number(valeur_placement);
            pos = pos - pas
            i++
        }
        
        const total_general = global_portefeuille + Number(comptedepot.r_solde_disponible);

        drawRightAligned(curPage, 552, 388, `${global_portefeuille}`, fontSize, helvetica, fillcolor);
        drawRightAligned(curPage, 552, 368, `${comptedepot.r_solde_disponible}`, fontSize, helvetica, fillcolor);
        drawRightAligned(curPage, 552, 345, `${total_general}`, fontSize, helveticaBold, fillcolor);
    
        /* TABLEAU DE DETAILS */

        let posTop = 704;
        pos = 196;
        pas = 20;

        curPage.drawText(new Date(dateFin).toLocaleDateString(), {x: 292, y: 279, size: 11, font: helveticaBold, color: fillcolor});
        curPage.drawText(new Date(dateDebut).toLocaleDateString(), {x: 358, y: 242, size: 9, font: helvetica, color: fillcolor});
        curPage.drawText(new Date(dateFin).toLocaleDateString(), {x: 442, y: 242, size: 9, font: helvetica, color: fillcolor});

        for (let j=operations.length-1; j>=0; j--) {

            if (j==operations.length-1) {
                curPage.drawText(`${new Date(dateDebut).toLocaleDateString()}`, {x: 52, y: pos, size: fontSize, font: helveticaBold, color: fillcolor});
                curPage.drawText(`Solde Initial`, {x: 121, y: pos, size: fontSize, font: helveticaBold, color: fillcolor});
                drawRightAligned(curPage, 548, pos, `${operations[j]?.r_solde_courrant}`, fontSize, helveticaBold, fillcolor);
                pos = pos-pas;
            } 

            if ((operations.length-1)<=5 || ((operations.length-1)-j)<6) {
                
                curPage.drawText(`${operations[j]?.r_date_creer.toLocaleDateString()}`, {x: 52, y: pos, size: fontSize, font: helvetica, color: fillcolor});
                curPage.drawText(`${operations[j]?.r_libelle}`, {x: 122, y: pos, size: 9, font: helvetica, color: fillcolor});
                let balance = 0;
                if (operations[j]?.e_type_operation==7 || operations[j]?.e_type_operation==9) {
                    balance = Number(operations[j]?.r_solde_courrant) - Number(operations[j]?.r_montant);
                    drawRightAligned(curPage, 414, pos, `${operations[j]?.r_montant}`, fontSize, helvetica, fillcolor);
                }
                if (operations[j]?.e_type_operation==6 || operations[j]?.e_type_operation==8) {
                    balance = Number(operations[j]?.r_solde_courrant) + Number(operations[j]?.r_montant);
                    drawRightAligned(curPage, 478, pos, `${operations[j]?.r_montant}`, fontSize, helvetica, fillcolor);
                }
                drawRightAligned(curPage, 548, pos, `${balance}`, fontSize, helvetica, fillcolor);
                
                pos = pos-pas;

            } else if ((operations.length-1)>6 && ((operations.length-1)-j)>6) {

                curPage = pages[1];

                curPage.drawText(`${operations[j]?.r_date_creer.toLocaleDateString()}`, {x: 52, y: posTop, size: fontSize, font: helvetica, color: fillcolor});
                curPage.drawText(`${operations[j]?.r_libelle}`, {x: 122, y: posTop, size: 9, font: helvetica, color: fillcolor});
                let balance = 0;
                if (operations[j]?.e_type_operation==7 || operations[j]?.e_type_operation==9) {
                    balance = Number(operations[j]?.r_solde_courrant) - Number(operations[j]?.r_montant);
                    drawRightAligned(curPage, 414, posTop, `${operations[j]?.r_montant}`, fontSize, helvetica, fillcolor);
                }
                if (operations[j]?.e_type_operation==6 || operations[j]?.e_type_operation==8) {
                    balance = Number(operations[j]?.r_solde_courrant) + Number(operations[j]?.r_montant);
                    drawRightAligned(curPage, 478, posTop, `${operations[j]?.r_montant}`, fontSize, helvetica, fillcolor);
                }
                drawRightAligned(curPage, 548, posTop, `${balance}`, fontSize, helvetica, fillcolor);

                posTop = posTop-pas
            }
        }
    
        curPage.drawText(`${comptedepot.r_date_modif.toLocaleDateString()}`, {x: 52, y: 80, size: fontSize, font: helveticaBold, color: fillcolor});
        curPage.drawText(`Solde liquidité`, {x: 122, y: 80, size: 9, font: helveticaBold, color: fillcolor});
        drawRightAligned(curPage, 548, 80, `${comptedepot.r_solde_disponible}`, fontSize, helveticaBold, fillcolor);
            
        /* FIN */

        // 💾 Sauvegarde locale du fichier
        const finalBytes = await outputPdf.save();
        const fileName = `RELEVE_${dateDebut}_${dateFin}.pdf`;
        // const outputPath = path.join(__dirname, '../../uploads', fileName);
        // fs.writeFileSync(outputPath, finalBytes);
        // const chemin_fichier = `${req.protocol}://${req.get('host')}//bnigestion_api/v1/temp/${fileName}`;
        
        console.log("Exportation de fichier de relever réussi")

          // 📤 Aperçu direct dans le navigateur

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename='+fileName);
        res.send(finalBytes);

    } catch (error) {
        next(error)
    }

}

module.exports = {
    getAllTypeOperations,
    // getOneOperation,
    getAllActeurOperations,
    opSouscription,
    opRachat,
    // opSouscriptionCompleted,
    opDepot,
    opTransfert,
    // saveOparation
    exportActeurOperation,
}