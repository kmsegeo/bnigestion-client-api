const db = require('../config/database');

const Message = {

    tableName: "_sc_gestion.t_msg",

    // async findLastInput() {
    //     const res = await db.query(`SELECT * FROM ${this.tableName} ORDER BY r_i DESC LIMIT 1`, []);
    //     return res.rows[0];
    // },

    async create(acteur, {msgid, type, contenu, operation}) {

        const date = new Date();

        const res = await db.query(`INSERT INTO ${this.tableName} (
                r_msgid, 
                r_type,
                r_contenu, 
                r_statut, 
                r_date_creer, 
                r_date_modif,
                r_operation,
                e_acteur) 
            VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING r_type, r_contenu, r_operation`, [msgid, type, contenu, 0, date, date, operation, acteur]);
        return res.rows[0];
    },
    
    async findByActeurId(acteurId) {
        const res = await db.query(`SELECT r_i, r_type, r_contenu, r_operation FROM ${this.tableName} WHERE e_acteur=$1 AND r_statut=$2 ORDER BY r_i DESC`, [acteurId, 0]);
        return res.rows[0];
    },
    
    async confirm(acteurId, id) {
        const res = await db.query(`
            UPDATE ${this.tableName} 
            SET r_statut=$1,
                r_date_modif=$2
            WHERE e_acteur=$3 AND r_i=$4
            RETURNING r_contenu, r_operation`, [1, new Date(), acteurId, id]);
        return res.rows[0];
    },

    async clean(acteur_id) {
        const res = await db.query(`
            UPDATE ${this.tableName} 
            SET r_statut=$1,
                r_date_modif=$2
            WHERE e_acteur=$3 AND r_statut=$4`, [2, new Date(), acteur_id, 0]);
        return res.rows;
    }

}

module.exports = Message;