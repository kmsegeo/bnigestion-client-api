const swaggerAutogen = require('swagger-autogen');

const doc = {
    info: {
        title: 'BNI Gestion - Client API',
        version: process.env.VERSION,
        description: `Application de gestion de fonds commun de placement`,
    },
    // host: '172.10.10.57/api/bamclient',
    host: 'localhost:3002',
    schemes: ['http']
};

const outpoutFile = './swagger-outpout.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen(outpoutFile, endpointsFiles, doc).then(()=>{
    require('./app.js');
});