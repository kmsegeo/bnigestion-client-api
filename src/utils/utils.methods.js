const db = require('../config/database');
const Message = require('../models/Message');
const TypeOperation = require('../models/TypeOperation');

const Utils = {
    
    async generateCode(prefix, db_table, column, spliter) {
        
        /**
         * [x] Récupération du code de la table passé en argument
         * [x] Si aucune valeur trouvée: retourner un code inittialisé 
         * [x] Sinon: spliter et incrémenter le surfix de 1, pour constituer un nouveau code
         */

        const queryStrind = `SELECT ${column} FROM ${db_table} ORDER BY r_i DESC LIMIT 1`;
        const result = db.query(queryStrind);
        const row = (await result).rows[0];

        if (!row) return `${prefix}${spliter}001`;

        const code = row[column];
        const surfix = code.split(spliter)[1];
        const n_surfix = parseInt(surfix) + 1;
        
        return prefix + spliter + (n_surfix<10 ? '00' + n_surfix : n_surfix<100 ? '0' + n_surfix : n_surfix);
    },

    async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },

    async expectedParameters(expected) {
        for (const [key, value] of Object.entries(expected)) {
            if (!value) throw `Le paramètre - ${key} - attendu est absent !`;
        }
    },

    async selectTypeOperation(operation) {
        const data = ['Souscription', 'Rachat', 'Transfert'];
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (operation.toLowerCase()==d.toLowerCase())
                return await TypeOperation.findCodeByIntitule(d);
        }
        return operation;
    },

    // async calculProflInvestisseur(point_total) {

    //     let profil_investisseur = null;
    //     let souhait = null;
    //     let inconvenient = null;
    //     let recommandation = null;

    //     if (point_total >= 0 && point_total <= 20) {
    //         profil_investisseur = 'Prudent';
    //         souhait = 'Protection de votre capital avec une faible prise de risques.';
    //         inconvenient = 'La valeur de vos investissements évoluera faiblement.';
    //         recommandation = 'FCP BRIDGE OBLIGATIONS';
    //     } else if (point_total >= 21 && point_total <= 29) {
    //         profil_investisseur = 'Équilibré';
    //         souhait = 'Croissance de vos investissements sur le moyen et le long terme, avec une prise de risques modérée.';
    //         inconvenient = 'La valeur de vos investissements pourrait diminuer.';
    //         recommandation = 'FCP BRIDGE EQUILIBRE';
    //     } else if (point_total >= 30 && point_total <= 39) {
    //         profil_investisseur = 'Dynamique';
    //         souhait = 'Croissance de vos investissements sur le long terme, avec une prise de risques élevée.';
    //         inconvenient = 'La valeur de vos investissements pourrait diminuer.';
    //         recommandation = 'FCP BRIDGE DIVERSIFIE CROISSANCE';
    //     } else if (point_total >= 40 ) {
    //         profil_investisseur = 'Audacieux';
    //         souhait = 'Maximiser la croissance de vos investissements sur le long terme, avec une prise de risques très élevée.';
    //         inconvenient = 'La valeur de votre investissement initial pourrait fortement diminuer.';
    //         recommandation = 'PORTEFEUILLE ACTIONS BRIDGE SECURITIES';
    //     } 

    //     return {point_total, profil_investisseur, souhait, inconvenient, recommandation} ;
    // },

    async genearteOTP_Msgid() {
        // const res = await db.query(`SELECT * FROM t_msg ORDER BY r_i DESC LIMIT 1`, []);
        // const row = res.rows[0];
        
        // if (!row) return `BNI1000000000`;

        // const prefix = "BNI";
        // const msgid = row["r_msgid"];
        // const surfix = msgid.split(prefix)[1];
        // const n_surfix = parseInt(surfix) + 1;
        
        // return prefix + n_surfix;
        return `BNI${new Date().getTime()}`;
    },

    async genearte_msgid() {
        return `BNI${new Date().getTime()}`;
    },

    async aleatoireOTP() {
        const min = Math.ceil(1000);
        const max = Math.floor(9999);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    async sendNotificationSMS(acteur_id, type, mobile, notification, operation, callback) {

        await Utils.genearte_msgid().then(async msgid => {
            await Message.create(acteur_id, {msgid, type, contenu:notification, operation}).then(async message => {                 // Operation: 1: activation, 2: reinitialisation, 3: notification
                
                fetch(process.env.ML_SMSCI_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        identify: process.env.ML_SMS_ID,
                        pwd: process.env.ML_SMS_PWD,
                        fromad: "BNI CI",
                        toad: mobile,
                        msgid: msgid,
                        text: message.r_contenu
                    })
                }).then(res => res.json()).then(sms_data => {
                    if (sms_data!=1) console.log(`Envoi de message echoué`, sms_data);
                    callback();
                }).catch(err => console.error(err)); 

            }).catch(err => console.error(err)); 
        }).catch(err => console.error(err)); 
    }

}

module.exports = Utils;