const errorhandling = require('./src/middlewares/error_handler');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger-outpout.json');
const bodyParser = require('body-parser');
const ressouceRoutes = require('./src/routes/ressources_routes');
const onbordingRoutes = require('./src/routes/onbording_routes');
const connexionRoutes = require('./src/routes/connexion_routes');
const sessionRoutes = require('./src/routes/session_routes');
const motdepasseRoutes = require('./src/routes/motdepasse_routes');
const sommaireRoutes = require('./src/routes/sommaire_routes.js');
const portefeuilleRoutes = require('./src/routes/portefeuille_routes');
const operationRoutes = require('./src/routes/operation_routes');
const webhookRoutes = require('./src/routes/webhook_routes');

const app = express(); 

app.use(cors()); 
app.use(express.json()); 

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const base_path = '/v1';
app.use(base_path + '/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(base_path + '/ressources', ressouceRoutes);
app.use(base_path + '/onbording', onbordingRoutes);
app.use(base_path + '/acteurs/connexion', connexionRoutes);
app.use(base_path + '/acteurs/sessions', sessionRoutes);
app.use(base_path + '/acteurs/motdepasse', motdepasseRoutes);

app.use(base_path + '/acteurs/sommaire', sommaireRoutes);
app.use(base_path + '/acteurs/operations', operationRoutes);
app.use(base_path + '/acteurs/portefeuilles', portefeuilleRoutes);

app.use(base_path + '/webhooks', webhookRoutes); 

// Error handling middlware 

app.use(errorhandling); 

module.exports = app; 