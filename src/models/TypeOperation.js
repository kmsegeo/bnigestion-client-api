const db = require('../config/database');

const TypeOperation = {

    tableName: `t_type_operation`,

    async findAll() {
        const queryString = `
            SELECT r_code, r_intitule, r_description, r_transaction 
            FROM ${this.tableName} WHERE r_statut=$1`;
        const res = db.query(queryString, [1]);
        return (await res).rows;
    },

    async findByCode(code) {
        const queryString = `
            SELECT r_i, r_code, r_intitule, r_description, r_transaction 
            FROM ${this.tableName} 
            WHERE r_code=$1 AND r_statut=$2`;
        const res = db.query(queryString, [code, 1]);
        return (await res).rows[0];
    },

    async findCodeByIntitule(intitule) {
        const queryStrind = `SELECT r_code FROM ${this.tableName} WHERE r_intitule=$1`;
        const result = await db.query(queryStrind, [intitule]);
        const row = result.rows[0];
        if (!row) return;
        return row['r_code'];
    },

    async findByIntitule(intitule) {
        const queryStrind = `SELECT r_i, r_code, r_description, r_transaction  FROM ${this.tableName} WHERE r_intitule=$1`;
        const result = await db.query(queryStrind, [intitule]);
        const row = result.rows[0];
        if (!row) return;
        return row['r_code'];
    }
}

module.exports = TypeOperation;