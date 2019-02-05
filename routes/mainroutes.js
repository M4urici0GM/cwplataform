const app = require('express')();
const mySqlPool = require('../Sockets/MySqlPool');
const sha256 = require('sha256');


app.get('/', (request, response, next) => {
    response.render('index', {profile: request.session.profile});
});

app.get('/dashboard', (request, response, next) => {
    if (request.session.profile) {
        response.render('userDashboard/dashboard', {profile: request.session.profile});
    } else {
        response.redirect('/login');
    }
});

app.get('/login', (request, response, next) => {
    if(request.session.profile) {
        response.redirect('/dashboard');
    } 
    response.render('userDashboard/login');
});

app.post('/authenticate', (request, response, next) => {
    console.log(request.body);
    let username = request.body.user;
    let password = request.body.password;
    mySqlPool.get().query("SELECT * FROM authme WHERE username OR realname = ?", [username], (err, results) => {
        if(err)
            throw err;
        if(results.length == 0 || !compareHash(password, results[0].password)) {
            response.send({authenticated: false});
        }else {
            request.session.profile = JSON.parse(JSON.stringify(results[0]));
            response.send({authenticated: true});            
        }
    });
});

function compareHash(password, hash) {
    var hash_arr = hash.split('$');
    var salt = hash_arr[2];
    var actual_hash = sha256( sha256(password) + salt );
    return (actual_hash == hash_arr[3]);
}


module.exports = app;