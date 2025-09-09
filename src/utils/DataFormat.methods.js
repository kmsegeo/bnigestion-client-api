
const DataFormat = {

    replaceIndividualDataNumeriques(data) {
        
        if (!data) return {};
        
        const civilite = ['', 'M', 'Mme', 'Mlle'];
        const type_piece = [``, `cni`,`Passport`,`permis`];
        const type_compte = [``, `Compte Individuel`, `Compte indivis`, `Compte conjoint`];

        data.r_civilite = civilite[data.r_civilite];
        data.r_type_piece = type_piece[data.r_type_piece];
        data.r_type_compte = type_compte[data.r_type_compte];

        return data;
    },

    replaceIndividualKYCNumeriques(kyc) {

        if (!kyc) return {};

        const civilite = ['', 'M', 'Mme', 'Mlle'];
        const type_piece = [``, `cni`,`Passport`,`permis`];
        const type_compte = [``, `Compte Individuel`, `Compte indivis`, `Compte conjoint`];
        const contexte_ouverture_compte = ["spontanée", "Recommandation", "Apporteur d'affaires", "Autres"];
        const ouverture_compte = ["A distance", "En présentiel"];
        const lien_parente_sgo = ["Non", "Oui"];
        const situation_matrimoniale = ["Célibataire", "Marié", "Conjoint de fait", "Veuf"];
        const situation_habitat = ["locataire", "co-propriétaire", "propriétaire"];
        const categorie_professionnelle = ["Salarié privée", "Fonctionnaire", "Fonctionnaire internationale", "Retraité", "Profession libérale", "entrepreneur", "Autres"];
        const langue_preferee = ["Français", "Anglais"];
        const origine_ressources_investies = ["Salaire", "Pension", "Bénéfice", "Autres"];
        const tranche_revenus = ["<500 000", "500 000 - 2 000 000", ">2 000 000"];
        const autres_actifs = ["Biens immobiliers", "Titres de participation", "Titres de créances", "Pars d'OPC", "Autres"];
        const autres_comptes_bridge = ["Non", "Oui"];
        const activites_politiques = ["Non", "Oui", "Autres"];
        const proche_politicien = ["Non", "Oui", "Autres"];
        
        kyc.r_civilite = civilite[kyc.r_civilite];
        kyc.r_type_piece = type_piece[kyc.r_type_piece];
        kyc.r_type_compte = type_compte[kyc.r_type_compte];
        kyc.r_contexte_ouverture_compte = contexte_ouverture_compte[kyc.r_contexte_ouverture_compte];
        kyc.r_ouverture_compte = ouverture_compte[kyc.r_ouverture_compte];
        kyc.r_lien_parente_sgo = lien_parente_sgo[kyc.r_lien_parente_sgo];
        kyc.r_situation_matrimoniale = situation_matrimoniale[kyc.r_situation_matrimoniale];
        kyc.r_situation_habitat = situation_habitat[kyc.r_situation_habitat];
        kyc.r_categorie_professionnelle = categorie_professionnelle[kyc.r_categorie_professionnelle];
        kyc.r_langue_preferee = langue_preferee[kyc.r_langue_preferee];
        kyc.r_origine_ressources_investies = origine_ressources_investies[kyc.r_origine_ressources_investies];
        kyc.r_tranche_revenus = tranche_revenus[kyc.r_tranche_revenus];
        kyc.r_autres_actifs = autres_actifs[kyc.r_autres_actifs];
        kyc.r_autres_comptes_bridge = autres_comptes_bridge[kyc.r_autres_comptes_bridge];
        kyc.r_activites_politiques = activites_politiques[kyc.r_activites_politiques];
        kyc.r_proche_politicien = proche_politicien[kyc.r_proche_politicien];

        return kyc
    },

    replaceCorporateKYCNumeriques(kyc) {

        if (!kyc) return {};
        
        const contexte_ouverture_compte = ["Démarche spontanée", "Recommandation d'un tiers", "Apporteur d'affaires", "Autres"];
        const ouverture_compte = ["A distance", "En présentiel"];
        const qualite = ["Association/ong", "TPE", "PME", "Grande Entreprise"];
        const document_identification = ["RCCM", "IDU", "Autres"];
        const app_groupe = ["Non", "Oui"];
        const chiffre_affaire = ["<500 000 000", "500 000 000 - 1 000 000 000", ">1 000 000 000 - <5 000 000 000", ">5 000 000 000"]
        const autres_comptes_bridge = ["Non", "Oui"];

        kyc.r_contexte_ouverture_compte = contexte_ouverture_compte[kyc.r_contexte_ouverture_compte];
        kyc.r_ouverture_compte = ouverture_compte[kyc.r_ouverture_compte];
        kyc.r_qualite = qualite[kyc.r_qualite];
        kyc.r_document_identification = document_identification[kyc.r_document_identification];
        kyc.r_app_groupe = app_groupe[kyc.r_app_groupe];
        kyc.r_chiffre_affaire = chiffre_affaire[kyc.r_chiffre_affaire];
        kyc.r_autres_comptes_bridge = autres_comptes_bridge[kyc.r_autres_comptes_bridge];
        
        return kyc
    }
}

module.exports = DataFormat;