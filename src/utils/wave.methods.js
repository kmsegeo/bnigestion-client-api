const axios = require("axios");
const response = require("../middlewares/response");

const Wave = {

    async checkout(montant, frais_operateur, mobile_payeur, url_erreur, url_succes, client_reference, callback) {

        console.log(`Création d'une Session de paiement..`);

        montant = montant==undefined ? 0 : Number(montant);
        frais_operateur = frais_operateur==undefined ? 0: Number(frais_operateur);

        const url = process.env.WAVE_URL + process.env.URI_CHECKOUT_SESSION;

        console.log(`Formatage de données`)
        const checkout_params = {
            amount: (montant + frais_operateur),
            currency: "XOF",
            client_reference,
            restrict_payer_mobile: mobile_payeur ? '+' + mobile_payeur : null,
            error_url: url_erreur ? url_erreur : "https://example.com/error",
            success_url: url_succes ? url_succes : "https://example.com/success",
        }

        console.log(`Envoi des données à Wave CI`)
        axios.post(url, checkout_params, {
            headers: {
                'Authorization': `Bearer ${process.env.WAVE_API_API_ALL}`,
                'Content-Type': 'application/json',
            },
        })
        .then((resp) => {
            console.log('Session de paiement générée avec succès');
            callback(resp.data)
        }).catch((error) => { throw error });

    }, 

    async checkoutCheck(checkout_id, callback) {

        console.log(`Vérification du paiement wave..`)
        const url = process.env.WAVE_URL + process.env.URI_CHECKOUT_SESSION;

        axios.get(url + `/${checkout_id}`, { headers: {'Authorization': `Bearer ${process.env.WAVE_API_API_ALL}`} })
        .then((resp) => {
            console.log(`Vérification du paiement ${checkout_id} terminé`);
            callback(resp.data)
        }).catch((error) => { throw error });

    },

    async refund(ref, callback) {

        console.log(`Restitution de fond wave..`)

        const url = process.env.WAVE_URL + process.env.URI_CHECKOUT_SESSION + `/${ref}/refund`;
        console.log(url);

        axios.post(url, {}, { headers: {'Authorization': `Bearer ${process.env.WAVE_API_API_ALL}`} })
        .then((resp) => {
            console.log(`Restitution de fond terminé`);
            callback(resp.data);
        }).catch((error) => { throw error });
    }
}

module.exports = Wave;