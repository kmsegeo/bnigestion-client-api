const db = require('../config/database');
const uuid = require('uuid');

const Portefeuille = {

    tableName: "t_portefeuille",

    async findLastByFonds() {
        const res = await db.query(`SELECT * FROM ${this.tableName}`, []);
        return res.rows;
    },

    async createPortefeuille() {},
    async getPortefeuilleById() {},
    async updatePortefeuille() {},
    async deletePortefeuille() {},

}

module.exports = Portefeuille;