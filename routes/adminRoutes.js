const app       = require('express')();
const mySqlPool = require('../Sockets/MySqlPool');
const sha256    = require('sha256');

app.get('/', (request, response, next) => {
    if ( !request.session.adminProfile ) {
        return response.redirect('/admin/login');
    }
    response.redirect('/admin/dashboard');
});

app.get('/dashboard', (request, response, next) => {
    if ( !request.session.adminProfile ) {
        return response.redirect('/admin/login');
    }
    getServers().then(servers => {
        getOnlinePlayers().then(onlinePlayers => {
            getNewPlayers().then(newPlayers => {
                console.log(newPlayers);
                console.log(onlinePlayers);
                response.render('admin/dashboard', {adminProfile: request.session.adminProfile, servers: servers, onlinePlayers: onlinePlayers, newPlayers: newPlayers});
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));
});

app.get('/login', (request, response, next) => {
    if ( request.session.adminProfile ) {
        return response.redirect('/admin');
    }
    response.render('admin/login');
});

app.post('/authenticate', (request, response, next) => {
    const adminUser = request.body.adminUser;
    const adminPass = request.body.adminPass;
    checkCredentials(adminUser, adminPass)
        .then((result) => {
            if ( result.return && (result.adminProfile !== undefined)){
                request.session.adminProfile = JSON.parse(JSON.stringify(result.adminProfile));
            }
            response.send({authenticated: result.return})
        }).catch(err => {
            console.log(err);
        });
});


async function checkCredentials(username, password) {
    const passwordHash = sha256(password);
    return new Promise((resolve, reject) => {
        mySqlPool.get().query(
            "SELECT * FROM cwplataform_admins WHERE adminEmail OR adminUsername = ? AND adminPassword = ?", 
            [username, passwordHash], (err, results) => {
                return ( !err ) ? resolve({return: (results.length > 0), adminProfile: results[0]}) : reject(err);
            }
        );
    });
}

async function getServers() {
    return new Promise((resolve, reject) => {
        mySqlPool.get().query("SELECT * FROM CWPlataform_Servers", (err, results) => {
            if ( err )
                reject(err);
            resolve(JSON.parse(JSON.stringify(results)));
        });
    });
}

async function getOnlinePlayers() {
    return new Promise((resolve, reject) => {
        mySqlPool.get().query("SELECT * FROM cwplataform_registeredplayers INNER JOIN cwplataform_servers ON fkServerId = serverId WHERE playerIsOnline = 1", (err, results) => {
            if ( err )
                reject(err);
            resolve(JSON.parse(JSON.stringify(results)));
        });
    });
}

async function getNewPlayers() {
    return new Promise((resolve, reject) =>{
        mySqlPool.get().query("SELECT * FROM cwplataform_registeredplayers WHERE playerRegisterDate = CURDATE()", (err, results) => {
            if ( err )
                return console.log(err);
            resolve(JSON.parse(JSON.stringify(results)));
        });
    });
}
module.exports = app;
