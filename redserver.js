const express = require('express');

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const Phone = require('./phone');

let phone = new Phone();

app.get('/', (req, res) => {

  res.render("index.ejs", {message:''});
});

app.get('/ring', (req, res) => {
  phone.startRinging();
  res.render("index.ejs", {message:'Phone ringing'});
});

app.get('/stopRing', (req, res) => {
  phone.stopRinging();
  res.render("index.ejs", {message:'Ringing stopped'});
});

var message = null;

app.post('/sendMessage', (req, res) => {
  phone.acceptMessage(req.body.message);
  res.render("index.ejs", {message:'Message sent'});
});

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const port = 3000;
console.log(`Server listening on:${port}`);

app.listen(port, () => console.log("Server started"));

