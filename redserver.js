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
  let message = req.body.message
  phone.acceptMessage(message);
  res.render("index.ejs", {message:`Message "${message}" sent. The phone will ring immediately with the message.`});
});

app.post('/sendQuestion', (req, res) => {
  let question = req.body.question;
  phone.acceptQuestion(question);
  res.render("index.ejs", {message:`Question "${question}" sent. The phone will ring later with the answer.`});
});

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const port = 3000;
console.log(`Server listening on:${port}`);

phone.ding();

app.listen(port, () => console.log("Server started"));

