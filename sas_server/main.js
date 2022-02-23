"use strict";// Optional. You will see this name in eg. 'ps' or 'top' command

const WebsocketServer = require('./WebsocketServer.js');
var mysql = require('mysql2/promise');
//var mysql = require('mysql');
const SASManager = require('./SASManager.js');
const util = require('util')

class Main {
    constructor( dbcon, wsport ) {
      this.id = 'id_1';
      this.websocketServer = null
      this.dbcon = dbcon;
      this.websocketport = wsport;
    }
    set name(name) {
      this._name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    get name() {
      return this._name;
    }
    runMain(  ) {
        this.websocketServer = new WebsocketServer( this );
      console.log('Hello, my name is ' + this.name + ', I have ID: ' + this.id);
    }
  }

const fs = require('fs');

//
// Read configuration
//

var rawdata
// default configuration
var config = JSON.parse("{\"type\":\"configuration\",\"data\":\
    {\
      \"websockets\": { \
          \"port\":1337 \
      }, \
      \"database\": { \
          \"host\": \"192.168.86.130\", \
          \"user\":\"root\", \
          \"password\":\"root\", \
          \"name\": \"FriendMaster\" \
      } \
  } \
}");
/*
var config = JSON.parse("{\"type\":\"configuration\",\"data\":\
    {\
      \"websockets\": { \
          \"port\":1337 \
      }, \
      \"database\": { \
          \"host\": \"215.148.12.6\", \
          \"user\":\"root\", \
          \"password\":\"root\", \
          \"name\": \"FriendMaster\" \
      } \
  } \
}");
*/

try {
    rawdata = fs.readFileSync('config.json');
    locconf = JSON.parse(rawdata);
    console.log( locconf );

    if( locconf.type == 'configuration' )
    {
        console.log("This is configuration");
    }
    // if success return loaded configuration
    config = locconf
    
} catch (err) {
    // Here you get the error when the file was not found,
    // but you also get any other error
  }

  //mysql.createConnection({
var connectionPool = mysql.createPool({
    connectionLimit : 100,
    host: config.data.database.host,
    user: config.data.database.user,
    password: config.data.database.password,
    database: config.data.database.name,
    waitForConnections: true,
  });

  connectionPool.getConnection((err, connection) => {
    if (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.')
      }
      if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.')
      }
      if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.')
      }
      console.log("connection err: " + err );
    }
    else
    {
    //if (connection) connection.release()
      console.log("connection NO err");
    }
    return
  });

  const connection = connectionPool.getConnection();

  //con.query = util.promisify( con.query );
  /*
con.connect( function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
  */
 console.log("Main start " + config.data.websockets.port );

var main = new Main( connectionPool, config.data.websockets.port );
main.runMain( );
