const errorhandling = require('./src/middlewares/error_handler');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express(); 

app.use(cors()); 
app.use(express.json()); 

app.use(bodyParser.json({limit: '50mb'})); 
app.use(bodyParser.urlencoded({limit: '50mb', extended: true})); 

// Error handling middlware 

app.use(errorhandling); 

module.exports = app; 