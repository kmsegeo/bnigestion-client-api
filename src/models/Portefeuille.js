const db = require('../config/database');
const uuid = require('uuid');

const Portefeuille = {

    tableName: "_sc_gestion.t_portefeuille",

    async findAllByActeurId(acteurId) {
        const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_acteur=$1 AND r_statut!=$2 ORDER BY r_i DESC`, [acteurId, '-1']);
        return res.rows;
    },

    async findUnactiveByActeurId(acteurId) {
        const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_acteur=$1 AND r_statut=$2 ORDER BY r_i DESC`, [acteurId, 0]);
        return res.rows;
    },

    async findActivesByActeurId(acteurId) {
        const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_acteur=$1 AND r_statut=$2 ORDER BY r_i DESC`, [acteurId, 1]);
        return res.rows;
    },

    async findRejectedByActeurId(acteurId) {
        const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_acteur=$1 AND r_statut=$2 ORDER BY r_i DESC`, [acteurId, 2]);
        return res.rows;
    },

    async createPortefeuille(acteur, operation, fonds, {cours_placement, nombre_parts, valeur_placement}) {
        const date = new Date()
        const res = db.query(`
            INSERT INTO ${this.tableName} (
                r_cours_placement,
                r_nombre_parts, 
                r_montant_placement,
                r_date_creer,
                r_date_modif,
                r_statut,
                e_fonds,
                e_operation,
                e_acteur)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *`, [cours_placement, nombre_parts, valeur_placement, date, date, 0, fonds, operation, acteur]);
        return (await res).rows[0];
    },
    
    async getPortefeuilleById() {},
    async updatePortefeuille() {},
    async deletePortefeuille() {},

}

module.exports = Portefeuille;