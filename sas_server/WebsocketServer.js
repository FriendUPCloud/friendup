"use strict";// Optional. You will see this name in eg. 'ps' or 'top' command

var http = require('http');

module.exports = class WebsocketServer {
  constructor( mainclass )
  {    
    process.title = 'stefkos';// Port where we'll run the websocket server
    this.webSocketsServerPort = mainclass.websocketport;// websocket and http servers
    this.webSocketServer = require('websocket').server;
    var dbcon = mainclass.dbcon; // database connection
    var SASManager = mainclass.SASManager; // SAS Manager

    console.log('Create on port: ' + this.webSocketsServerPort );

    //
    // Global variables
    //

    // latest 100 messages
    var history = [ ];
    // list of currently connected clients (users)
    var clients = [ ];

    //
    // Helper function for escaping input strings
    //

    function htmlEntities(str)
    {
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    // Array with some colors
    var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];

    // ... in random order
    colors.sort(function(a,b) { return Math.random() > 0.5; } );

    //
    // HTTP server
    //

    this.server = http.createServer( function( request, response ) 
    {
      // Not important for us. We're writing WebSocket server,
      // not HTTP server
    });

    console.log('Create on port 2: ' + this.webSocketsServerPort );
    //this.server.listen( 1337, function()
    var globalWSPort = this.webSocketsServerPort;
    this.server.listen( this.webSocketsServerPort, function()
    {
      console.log( (new Date()) + ' Server is listening on port ' + globalWSPort );
    });

    //
    // WebSocket server
    //

    this.wsServer = new this.webSocketServer({
      // WebSocket server is tied to a HTTP server. WebSocket
      // request is just an enhanced HTTP request. For more info 
      // http://tools.ietf.org/html/rfc6455#page-6
      httpServer: this.server
    });

    // This callback function is called every time someone
    // tries to connect to the WebSocket server
    this.wsServer.on('request', function(request)
    {
      console.log( (new Date() ) + ' Connection from origin ' + request.origin + '.');  
      // accept connection - you should check 'request.origin' to
      // make sure that client is connecting from your website
      // (http://en.wikipedia.org/wiki/Same_origin_policy)

      var connection = request.accept( null, request.origin );

      // we need to know client index to remove them on 'close' event
      var index = clients.push( connection ) - 1;
      var userName = false;
      //var userColor = false;  console.log( (new Date() ) + ' Connection accepted.' );  // send back chat history

      //if( history.length > 0 ) 
      //{
      //  connection.sendUTF( JSON.stringify({ type: 'history', data: history} ) );
      //}  // user sent some message
  
      connection.on('message', function( message ) 
      {
        if (message.type === 'utf8') 
        { 

          try {
            msg = JSON.parse(message.utf8Data);

            var resp = SASManager.register( connection, msg.sessionid, msg.authid, msg.type, msg.sasid );

            connection.sendUTF( resp );
          } catch(e) {
            //alert(e); // error in the above string (in this case, yes)!
          }

          // accept only text
          // first message sent by user is their name     if (userName === false) {
          // remember user name
          //userName = htmlEntities(message.utf8Data);
          // get random color and send it back to the user
          //userColor = colors.shift();
          //connection.sendUTF('your message was: ' + message.utf8Data );
          //connection.sendUTF( JSON.stringify({ type:'color', data: userColor }) );

          //console.log((new Date()) + ' User is known as: ' + userName  + ' with ' + userColor + ' color.');      
        }
        /*
        else
        { // log and broadcast the message
          console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
        
          // we want to keep history of all sent messages
          var obj = {
            time: (new Date()).getTime(),
            text: htmlEntities(message.utf8Data),
            author: userName,
            color: userColor
          };
          history.push(obj);
          history = history.slice(-100);        // broadcast message to all connected clients
          var json = JSON.stringify({ type:'message', data: obj });
          for( var i=0; i < clients.length; i++ ) 
          {
            clients[i].sendUTF(json);
          }
        }*/
      });

      // user disconnected

      connection.on('close', function(connection)
      {
        if( userName !== false && userColor !== false ) 
        {
          console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
          // remove user from the list of connected clients
          //clients.splice(index, 1);
          // push back user's color to be reused by another user
          //colors.push(userColor);
        }
      });
    });
  }
};
