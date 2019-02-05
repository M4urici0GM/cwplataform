'use strict';
const _Path           = require('path');
const appConfig       = require('./appConfig');
const express         = require('express');
const cookieParser    = require('cookie-parser');
const expressSession  = require('express-session');
const bodyParser      = require('body-parser');
const _App            = express();
const _Server         = require('http').createServer(_App);
const _SocketIO       = require('socket.io').listen(_Server);
const cookieSession   = cookieParser(appConfig.session.secret);
const sessionStore    = new expressSession.MemoryStore();
const morgan          = require('morgan');

//Socket imports.
const mySqlPool  = require(_Path.join(__dirname, 'Sockets/MySqlPool'));
const mainSocket = require(_Path.join(__dirname, 'Sockets/SocketIO'));

//Routes imports.
const mainRoutes  = require(_Path.join(__dirname, "Routes/mainroutes"));
const adminRoutes = require(_Path.join(__dirname, "Routes/adminRoutes"));

//Express middleware.
_App.set('views', _Path.join(__dirname, appConfig.server.viewsFolder));
_App.set('view engine', appConfig.server.viewEngine);
_App.use(bodyParser.json());
_App.use(bodyParser.urlencoded({extended: true}));
_App.use(express.static(_Path.join(__dirname, appConfig.server.publicFolder)));
_App.use(cookieSession);
_App.use(morgan('dev'));
_App.use(expressSession({ secret: appConfig.session.secret, name: appConfig.session.name, resave: true, saveUninitialized: true, store: sessionStore }));
_App.use(mainRoutes);
_App.use('/admin', adminRoutes);

//Initializes mySQL connection pool.
mySqlPool.init(appConfig.database);

/////SocketIO
//socket.io MiddleWare session check.
_SocketIO.use((socket, next) => {
  if (socket.handshake.query.Client_Type == 'MCServer') {
    
    if ( !socket.handshake.query.token )
      return next(new Error('Please, especify an access token'));

    mySqlPool.get().query("SELECT * FROM cwplataform_servers INNER JOIN accesstokens ON serverToken = tokenId WHERE tokenHash = ?", [socket.handshake.query.token], (err, results) => {
      if ( results.length > 0 ) {
        var serverDetails = JSON.parse(JSON.stringify(results))[0];
        socket.emit('AccessGranted');
        _SocketIO.sockets.emit('ServerConnected', serverDetails.serverId);
        mySqlPool.get().query("UPDATE cwplataform_servers SET serverIsOnline = 1, serverSocketID = ? WHERE serverId = ?", [socket.id ,serverDetails.serverId], ( err ) =>{
          if ( err )
            console.log(err);
          socket.handshake.serverDetails = serverDetails;
          return next();
        });
      } else {
        socket.disconnect();
        return next(new Error("Access Denied"));
      }
    });
      
  } else {
    var data = socket.request;
    cookieSession(data, {}, (err) => {
      // console.log(data);
      var sessionID = data.signedCookies[appConfig.session.name];
      sessionStore.get(sessionID, (err, session) => {
        if ( (err || !session) || (!session.profile && !session.adminProfile)) {
          return next(new Error("Access Denied"));
        } else if ( (!session.profile && session.adminProfile) || (session.profile && !session.profile) || (session.profile && session.profile) ) {
          socket.handshake.session = session;
          return next();
        }
      });
    });
  }
});
//Initializes socket.io main socket.
mainSocket(_SocketIO);


_Server.listen(appConfig.server.port, () => {
  console.log(`Server running on port ${appConfig.server.port}`);
});