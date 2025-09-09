const db = require('../config/database');

const TypeActeur = {
    
    table_name: 't_type_acteur',

    async findAll() {
        const query_string = `SELECT r_code, r_intitule, r_description FROM ${this.table_name}`;
        const res = await db.query(query_string);
        return res.rows;
    },

    async findById(id) {
        const query_string = `SELECT r_code, r_intitule, r_description FROM ${this.table_name} WHERE r_i=$1`;
        const res = await db.query(query_string, [id]);
        return res.rows[0];
    }
}

const Particulier = {

    table_name: 't_particulier',

    async create({
            civilite, 
            nom, 
            nom_jeune_fille, 
            prenom, 
            date_naissance, 
            nationalite, 
            type_piece, 
            numero_piece, 
            validite_piece,
            e_acteur
        }) {
        const query_string = `
            INSERT INTO ${this.table_name} (
                r_civilite,
                r_nom,
                r_nom_jeune_fille,
                r_prenom,
                r_date_naissance, 
                r_nationalite,
                r_type_piece,
                r_numero_piece,
                r_validite_piece,
                e_acteur) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
        
        const res = await db.query(query_string, [
            civilite, 
            nom, 
            nom_jeune_fille, 
            prenom, 
            date_naissance, 
            nationalite, 
            type_piece, 
            numero_piece, 
            validite_piece,
            e_acteur]);
        
        return res.rows[0];
    },

    async findById(id) {
        const query_string = `SELECT * FROM ${this.table_name} WHERE r_i=$1`;
        const res = await db.query(query_string, [id]);
        return res.rows[0];
    },

    async findByCompteTitre(compte_titre) {
        const query_string = `SELECT * FROM ${this.table_name} WHERE r_ncompte_titre=$1`;
        const res = await db.query(query_string, [compte_titre]);
        return res.rows[0];
    },

    async update(id, {civilite, nom, nom_jeune_fille, prenom, date_naissance, nationalite, type_piece, num_piece}) {

        const query_string = `
            UPDATE ${this.table_name} 
            SET r_civilite=$1, 
                r_nom=$2, 
                r_nom_jeune_fille=$3, 
                r_prenom=$4, 
                r_date_naissance=$5, 
                r_nationalite=$6, 
                r_type_piece=$7, 
                r_num_piece=$8 
            WHERE r_i=$9
            RETURNING *`;

        const res = await db.query(query_string, [civilite, nom, nom_jeune_fille, prenom, date_naissance,  nationalite, type_piece, num_piece, id]);
        return res.rows[0];
    },

    async setAtsgoCallbackData(particulier_id, atsgo_id_client, atsgo_compte_titre, atsgo_compte_espece) {
        const query_string = `UPDATE ${this.table_name} SET r_atsgo_id_client=$1, r_ncompte_titre=$2, r_ncompte_espece=$3 WHERE r_i=$4 RETURNING *`;
        const res = await db.query(query_string, [atsgo_id_client, atsgo_compte_titre, atsgo_compte_espece, particulier_id]);
        return res.rows[0];
    },

    async cleanAll() {
        const res = await db.query(`DELETE FROM ${this.table_name} WHERE r_i <> $1 RETURNING r_i`, [1]);
        return res.rows;
    }
}

const Entreprise = {

    table_name: 't_entreprise',

    async create({raison_sociale, forme_juridique, capital_social, siege_social, compte_contribuable, registre_com, compte_titre, compte_espece}) {
        
        const query_string = `
            INSERT INTO ${this.table_name} (
                r_raison_sociale,
                r_forme_juridique,
                r_capital_social,
                r_siege_social,
                r_compte_contribuable,
                r_registre_com,
                r_ncompte_titre,
                r_ncompte_espece) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`;

        const res = await db.query(query_string, [raison_sociale, forme_juridique, capital_social, siege_social, compte_contribuable, registre_com, compte_titre, compte_espece]);
        return res.rows[0];
    },

    async findById(id) {
        const query_string = `SELECT * FROM ${this.table_name} WHERE r_i=$1`;
        const res = await db.query(query_string, [id]);
        return res.rows[0];
    },

    async update(id, {raison_sociale, forme_juridique, capital_social, siege_social, compte_contribuable, registre_com}) {

        const query_string = `
            UPDATE ${this.table_name} 
            SET r_raison_sociale=$1,
                r_forme_juridique=$2,
                r_capital_social=$3,
                r_siege_social=$4,
                r_compte_contribuable=$5,
                r_registre_com=$6
            WHERE r_i=$7
            RETURNING *`;

        const res = await db.query(query_string, [raison_sociale, forme_juridique, capital_social, siege_social, compte_contribuable, registre_com, id]);
        return res.rows[0];
    },

}

module.exports = {
    Particulier,
    Entreprise,
    TypeActeur
}