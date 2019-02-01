const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const api = require('./api');
const config = require('../config.js');
const middlewares = require('./utils/middlewares');
const app = express();
const client = path.resolve(__dirname, '../client/app.build.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(middlewares);
app.use('/api', api);
app.get('/app.build.js', (req, res)=> res.sendFile(client));
app.use(express.static(path.resolve(__dirname, '../', 'assets')));
app.listen(config.port);

console.log(`Listening on port ${config.port}`);
