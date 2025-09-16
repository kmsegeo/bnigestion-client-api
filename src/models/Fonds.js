const db = require('../config/database');

const Fonds = {

    tableName: '_sc_gestion.t_fonds',
    codePrefix: 'FCP',
    codeColumn: 'r_code',

    async findAll() {
        const res = db.query(`SELECT 
            r_code, 
            r_intitule, 
            r_description, 
            r_commission_souscription, 
            r_commission_sortie FROM ${this.tableName} WHERE r_statut=$1`, [1]);
        return (await res).rows;
    },

    async findById(id) {
        const res = db.query(`
            SELECT 
                r_code, 
                r_intitule, 
                r_description, 
                r_commission_souscription, 
                r_commission_sortie
            FROM ${this.tableName}
            WHERE r_i=$1 AND r_statut=$2`, [id, 1]);
        return (await res).rows[0];
    },

    async findByCode(code) {
        const res = db.query(`
            SELECT 
                r_i,
                r_code, 
                r_intitule, 
                r_description, 
                r_commission_souscription, 
                r_commission_sortie
            FROM ${this.tableName}
            WHERE r_code=$1 AND r_statut=$2`, [code, 1]);
        return (await res).rows[0];
    },

    async findByIntitule(intitule) {
        const res = db.query(`
            SELECT r_i,
                r_code, 
                r_intitule, 
                r_description, 
                r_commission_souscription, 
                r_commission_sortie
            FROM ${this.tableName}
            WHERE r_intitule=$1 AND r_statut=$2`, [intitule, 1]);
        return (await res).rows[0];
    }

}

module.exports = Fonds;