const db = require('../config/database');

const ValeurLiquidative = {

    tableName: '_sc_gestion.t_val_liquidative',

    // async findAllBetween2Date(from, to) {
        
    //     const start = from.toString() + ' 00:00';
    //     const end = to.toString() +' 23:59';

    //     const res = db.query(`SELECT * FROM ${this.tableName} WHERE r_date_creer BETWEEN $1 AND $2`, [start, end]);
    //     return (await res).rows;
    // },

    // async findAllByFondsBetween2Date(fonds, from, to) {

    //     const start = from.toString() + ' 00:00';
    //     const end = to.toString() +' 23:59';
        
    //     const res = db.query(`SELECT * FROM ${this.tableName} WHERE e_fonds=$1 AND r_date_creer BETWEEN $2 AND $3`, [fonds, start, end]);
    //     return (await res).rows;
    // },

    async findById(id) {
        const res = db.query(`SELECT 
            r_valeur, 
            r_datevl, 
            r_description,
            r_valeur_precedente,
            r_date_precedente FROM ${this.tableName} WHERE r_i=$1`, [id]);
        return (await res).rows[0]
    },

    async findLastByFonds(fonds) {
        const res = db.query(`SELECT 
            r_valeur, 
            r_datevl, 
            r_description,
            r_valeur_precedente,
            r_date_precedente FROM ${this.tableName} WHERE e_fonds=(SELECT r_i FROM t_fonds WHERE r_code=$1) AND r_statut=$2 ORDER BY r_datevl DESC LIMIT 1`, [fonds, 1]);
        return (await res).rows[0];
    },

    async findAllByFonds(fonds) {
        const res = db.query(`SELECT 
            r_valeur, 
            r_datevl, 
            r_description,
            r_valeur_precedente,
            r_date_precedente FROM ${this.tableName} WHERE e_fonds=$1 AND r_statut=$2 ORDER BY r_datevl DESC`, [fonds, 1]);
        return (await res).rows;
    },
    
    async update(id, fonds, {valeur, datevl, description, valeur_precedente, date_precedente}) {
        const res = db.query(`
            UPDATE ${this.tableName} 
            SET r_valeur=$1,
                r_datevl=$2,
                r_description=$3,
                r_valeur_precedente=$4
                r_date_precedente=$5,
                r_date_modif=$6,
                e_fonds=$7,
            WHERE r_i=$11 RETURNING *`, [
                valeur,
                datevl,
                description,
                valeur_precedente, 
                date_precedente,
                new Date(),
                fonds,
                id]);
        return (await res).rows[0];
    }
}

module.exports = ValeurLiquidative;