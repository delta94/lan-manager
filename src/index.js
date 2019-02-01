const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const api = require('./api');
const config = require('../config.js');
const middlewares = require('./utils/middlewares');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(middlewares);
app.use('/api', api);
app.use(express.static(path.resolve(__dirname, '../static')));
app.listen(9000);

console.log(`Listening on port 9000`);
