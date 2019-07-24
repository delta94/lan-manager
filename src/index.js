const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const api = require('./api');
const config = require('./config');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api', api);
app.use(express.static(path.resolve(__dirname, '../public')));
app.use((err, req, res, next)=> {
  console.error(err);
  res.apiFail();
});
app.listen(config.port);

console.log(`Listening on port ${config.port}`);
