const db = require('../config/database');

const TypeActeur = {

    tableName: `_sc_auth.t_type_acteur`,

    async findAll() {
        const queryString = `
            SELECT r_code, r_intitule, r_description 
            FROM ${this.tableName}
            WHERE r_statut=$1`;
        const res = db.query(queryString, [1]);
        return (await res).rows;
    },

    async findById(id) {
        const queryString = `
            SELECT r_code, r_intitule, r_description 
            FROM ${this.tableName} 
            WHERE r_i=$1 AND r_statut=$2`;
        const res = db.query(queryString, [id, 1]);
        return (await res).rows[0];
    }, 

    async findByCode(code) {
        const queryString = `
            SELECT r_i, r_code, r_intitule, r_description 
            FROM ${this.tableName} 
            WHERE r_code=$1 AND r_statut=$2`;
        const res = db.query(queryString, [code, 1]);
        return (await res).rows[0];
    }
}

module.exports = TypeActeur;