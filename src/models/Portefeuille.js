const db = require('../config/database');
const uuid = require('uuid');

const Portefeuille = {

    tableName: "_sc_gestion.t_portefeuille",

    async findLastByFonds() {
        const res = await db.query(`SELECT * FROM ${this.tableName} WHERE r_statut=$1`, [1]);
        return res.rows;
    },

    async createPortefeuille(acteur, fonds, {nombre_parts, cours_placement, cours_moy_placement, retour_placement, rendement, valeur_placement}) {
        const date = new Date()
        const res = db.query(`
            INSERT INTO ${this.tableName} (
                r_nombre_parts, 
                r_cours_placement,
                r_cours_moy_placement,
                r_retour_placement,
                r_rendement,
                r_valeur_placement,
                r_date_creer,
                r_date_modif,
                e_fonds,
                e_acteur)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`, [nombre_parts, cours_placement, cours_moy_placement, retour_placement, rendement, valeur_placement, date, date, fonds, acteur]);
        return (await res).rows[0];
    },
    
    async getPortefeuilleById() {},
    async updatePortefeuille() {},
    async deletePortefeuille() {},

}

module.exports = Portefeuille;