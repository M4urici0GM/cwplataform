


module.exports = function (socketIO) {
    const appConfig = require('../appConfig');
    const mySqlPool = require('./MySqlPool');

    let OnlinePlayers = [];

    socketIO.on('connection', (socket) => {
    
        socket.on('bootstrap', (data) => {
            console.log("A New " + ((socket.handshake.query.Client_Type == "MCServer") ? "Minecraft Server Connected" : "WebClient") + "Connected");
            mySqlPool.get().query('UPDATE cwplataform_servers SET onlinePlayers = ? WHERE serverId = ?', [data.OnlinePlayers, socket.handshake.serverDetails.serverId], (err) => {
                if( err )
                    console.log(err);
            });
        });
    
        socket.on('disconnect', () => {
            if ( socket.handshake.serverDetails ) {
                socketIO.sockets.emit('ServerDisconnected', socket.handshake.serverDetails.serverId);
                mySqlPool.get().query("UPDATE cwplataform_servers SET serverIsOnline = 0, onlinePlayers = 0 WHERE serverId = ?", [socket.handshake.serverDetails.serverId], (err) => {
                    if ( err )
                        console.log(err);
                });
            }
        });

        socket.on('PlayerJoined', (data) => {
           
            mySqlPool.get().query('SELECT * FROM cwplataform_registeredplayers WHERE playerName = ?',[data.playerName], (err, results) => {
                console.log(err);
                console.log(results.length);
                if ( results.length > 0 ) {
                    updateDBOnlinePlayers(socket.handshake.serverDetails.serverId, true).then(() => {
                        sendPlayerUpdate(true, false, data.playerName).then(() => {}).catch(err => console.log(err));
                    }).catch(err => console.log(err));
                } else {
                    mySqlPool.get().query("INSERT INTO cwplataform_registeredplayers() VALUES (null, ?, NOW(), ?, 1)", [data.playerName, socket.handshake.serverDetails.serverId], (err) => {
                        if ( err )
                            console.log(err);
                        updateDBOnlinePlayers(socket.handshake.serverDetails.serverId, true).then(() => {
                            sendPlayerUpdate(true, data.playerName).then().catch(err => console.log(err));
                        }).catch(err => console.log(err));
                    });
                }
            });
        });

        socket.on('PlayerQuitted', (data) => {
            updateDBOnlinePlayers(socket.handshake.serverDetails.serverId, false).then(() => {
                sendPlayerUpdate(false, data.playerName).then(() => {}).catch(err => console.log(err));
            }).catch(err => console.log(err));
        });

    });
    
    async function updateDBOnlinePlayers(serverId, connect) {
        return new Promise((resolve, reject) => {
            mySqlPool.get().query("SELECT onlinePlayers FROM cwplataform_servers WHERE serverId = ?", [serverId], (err, results) => {
                if ( err )
                    return reject(err);
                var obj = JSON.parse(JSON.stringify(results))[0];
                var onlineCount = (connect ? obj.onlinePlayers+1 : obj.onlinePlayers-1);
                mySqlPool.get().query("UPDATE cwplataform_servers SET onlinePlayers = ? WHERE serverId = ?", [onlineCount, serverId], (err) => {
                    if ( err )
                        return reject(err);
                    return resolve();
                });
            });
        });
    }

    async function sendPlayerUpdate(connect, playerName) {
        var connectedClients = socketIO.sockets.sockets;
        return new Promise((resolve, reject) => {
            mySqlPool.get().query('SELECT playerId, serverId, playerName, playerRegisterDate, serverName FROM cwplataform_registeredplayers INNER JOIN cwplataform_servers ON fkServerId = serverId WHERE playerName = ?', [playerName], (err, player) => {
                if ( err ) 
                    return reject(err);
                var playerData = JSON.parse(JSON.stringify(player))[0];

                var timeDiff = Math.abs(new Date(getActualDate()).getTime() - new Date(playerData.playerRegisterDate).getTime());
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                playerData.newPlayer = (diffDays == 0);

                for (client in connectedClients) {
                    var clientSocket = socketIO.sockets.sockets[client];
                    if ( !clientSocket.handshake.serverDetails ) {
                        clientSocket.emit((connect ? 'PlayerJoined' : 'PlayerQuitted'), playerData);
                    }
                }
                mySqlPool.get().query("UPDATE cwplataform_registeredplayers SET playerIsOnline = ? WHERE playerName = ? AND fkServerId = ?", [connect, playerName, playerData.serverId]);
            });
        });
    }

    function getActualDate() {
        var today = new Date();
        var dd    = today.getDate();
        var mm    = today.getMonth() + 1;
        var yyyy  = today.getFullYear();

        dd = (dd < 10 ? `0${dd}` : dd);
        mm = (mm < 10 ? `0${mm}` : mm);
        today = `${mm}/${dd}/${yyyy}`;
        return today;
    }
}