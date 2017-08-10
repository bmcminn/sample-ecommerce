const fs    = require('fs');
const path  = require('path');
const db    = require(__dirname + '/app/db.js');


const Express = require('express');

const app = new Express();


app.set('db', db);


// TODO: add user auth check middleware
// app.use(require(__dirname + '/app/middleware/auth.js'));


app.get('/', (req, res) => {

    let homepage = fs.readFileSync(__dirname + '/app/views/index.html');

    res.write(homepage);
    res.end();
});



let api = Express.Router();

api.get('/', (req, res) => {
    res.write('welcome to the Sample Application API v1!');
    res.end();
});


api.get('/brands', (req, res) => {

    let db = req.app.get('db');

    db.brands
        .find({})
        .sort({ name: 1 })
        .exec((err, brands) => {
            res.json(brands);
        })
        ;

});


app.use('/api/v1/', api);



app.listen(process.env.PORT || '3005');
