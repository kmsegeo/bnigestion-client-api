const db = require('../config/database');
const TypeDocument = require('./TypeDocument');
const uuid = require('uuid');

const Document = {

    tableName: '_sc_gestion.t_document',

    async findAll() {
        const res = await db.query(`
            SELECT 
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND td.r_statut=$1`, [1]);
        return res.rows;
    },

    async findAllByTypeDocumentId(type_id) {
        const res = await db.query(`
           SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND td.e_type_document=$1 AND td.r_statut=$2`, [type_id, 1]);
        return res.rows
    },

    async create({acteur_id, type_document, nom_fichier, chemin_fichier}) {
        const date = new Date();
        const res = await db.query(`
            INSERT INTO ${this.tableName} (
                r_reference,
                r_date_creer,
                r_date_modif,
                r_statut,
                e_type_document,
                e_acteur,
                r_nom_fichier,
                r_chemin_fichier) 
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING 
                r_i,
                r_reference,
                r_nom_fichier, 
                r_chemin_fichier,
                r_date_creer, 
                r_date_modif`, [uuid.v4(), date, date, 1, type_document, acteur_id, nom_fichier, chemin_fichier]);
        return res.rows[0];
    },

    async findById(id) {
        const res = await db.query(`
            SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND td.r_i=$1 AND td.r_statut=$2`, [id, 1]);
        return res.rows[0];
    },

    async update({acteur_id, type_document, nom_fichier, chemin_fichier}) {
        const date = new Date();
        const res = await db.query(`UPDATE ${this.tableName} 
            SET r_date_modif=$1,
                r_nom_fichier=$2,
                r_chemin_fichier=$3
            WHERE e_acteur=$4 AND e_type_document=  $5
            RETURNING r_i,
                r_reference,
                r_nom_fichier, 
                r_chemin_fichier,
                r_date_creer, 
                r_date_modif`, [date, nom_fichier, chemin_fichier, acteur_id, type_document]);
        return res.rows[0];
    },

    async findByRef(ref) {
        const res = await db.query(`
            SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt 
            WHERE td.e_type_document=tt.r_i AND td.r_reference=$1 AND td.r_statut=$2`, [ref, 1]);
        return res.rows[0]
    },

    async findAllByActeurId(acteur_id) {
        const res = await db.query(`
            SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND td.e_acteur=$1 AND td.r_statut=$2`, [acteur_id, 1]);
        return res.rows;
    },

    async findBySpecific(acteur_id, intitule) {
        console.log(acteur_id, intitule);
        const res = await db.query(`
            SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND td.e_acteur=$1 AND td.r_statut=$2 AND tt.r_intitule=$3
            ORDER BY r_i DESC`, [acteur_id, 1, intitule]);
        return res.rows[0];
    },

    async findAllByIntitule(intitule) {
        const res = db.query(`
            SELECT 
                td.r_i,
                tt.r_intitule,
                td.r_reference,
                td.r_nom_fichier,
                td.r_chemin_fichier,
                td.r_date_creer,
                td.r_date_modif
            FROM ${this.tableName} As td, ${TypeDocument.tableName} As tt  
            WHERE td.e_type_document=tt.r_i AND tt.r_intitule=$1 AND td.r_statut=$2`, [intitule, 1]);
            
        return (await res).rows;
    },

}

module.exports = Document;