const db = require('../config/database');

const CompteDepot = {

    tableName: '_sc_gestion.t_compte_depot',

    async create ({acteur}) {

        const date = new Date();

        const queryString = `
            INSERT INTO 
                ${this.tableName} (r_numero_compte, r_solde_disponible, r_date_creer, r_date_modif, e_acteur)
            VALUES 
                ($1,$2,$3,$4,$5) 
            RETURNING 
                r_numero_compte, r_solde_disponible, r_date_creer, r_date_modif`;
        const res = await db.query(queryString, [0, date, date, acteur]);

        return res.rows[0];
    },

    async findByActeurId (acteur) {
        const res = await db.query(`
            SELECT 
                r_numero_compte, r_solde_disponible, r_date_creer, r_date_modif 
            FROM 
                ${this.tableName} 
            WHERE e_acteur=$1`, [acteur]);
        return res.rows[0];
    },

    async mouvement (acteur, {montant}) {

        const queryString = `
            UPDATE ${this.tableName} 
            SET r_solde_disponible=$1, r_date_modif=$2
            WHERE e_acteur=$3
            RETURNING r_numero_compte, r_solde_disponible, r_date_creer, r_date_modif`;
        const res = await db.query(queryString, [montant, new Date(), acteur]);
        
        return res.rows[0];
    }
}

module.exports = CompteDepot