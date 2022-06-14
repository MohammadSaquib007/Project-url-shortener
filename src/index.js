const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const route = require('./routes/route.js');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://users-open-to-all:hiPassword123@cluster0.uh35t.mongodb.net/pkDB?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log('DB connected'))
    .catch(err => console.log(err))

app.use('/', route)

app.listen(process.env.port || 3000, function () {
    console.log('express app running on port' + (process.env.port || 3000))

})