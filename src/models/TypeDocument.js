const db = require('../config/database');

const TypeDocument = {

    tableName: `t_type_document`,

    async findAll() {
        const queryString = `SELECT * FROM ${this.tableName}`;
        const res = db.query(queryString, []);
        return (await res).rows;
    },

    async findById(id) {
        const queryString = `
            SELECT r_code, r_intitule, r_description, r_format
            FROM ${this.tableName} 
            WHERE r_i=$1`;
        const res = db.query(queryString, [id]);
        return (await res).rows[0];
    }, 

    async findByCode(code) {
        const queryString = `
            SELECT r_i, r_code, r_intitule, r_description, r_format FROM ${this.tableName} WHERE r_code=$1`;
        const res = db.query(queryString, [code]);
        return (await res).rows[0];
    },

    async findByIntitule(intitule) {
        const queryString = `
            SELECT r_i, r_code, r_intitule, r_description, r_format FROM ${this.tableName} WHERE r_intitule=$1`;
        const res = db.query(queryString, [intitule]);
        return (await res).rows[0];
    },
}

module.exports = TypeDocument;