/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// Network class that handles Friend Core to Friend Core connections as well as
// our encrypted WebRTC based peer-to-peer network

var thisIsSelf;

FriendNetwork = {
    // Vars
    debugging: false,
    onlineStatus: false,
    sessions: [ ], // List of applications and processes that use the friend network
    conn: null, // network connection
    connectPile: [ ], // Pile for connect timeout
    networkId: false,

    // Methods
    init: function( host, sessionId, hostMeta )
    {
        console.log( 'FriendNetwork.init' );
        /*
         hostMeta is optinal, and is used to make your host human readable on the network
         hostMeta can contain:
         name, <string>
         description, <string>
         apps, [ appMeta, .. ]
         imagePath, <string>

         hostMeta can also be updated later with .updateMeta
         */
         
        var hostMeta = hostMeta || {
            name        : 'yeppers',
            description : 'fastly done in a port',
            imagePath   : 'friend://path.to/image?',
            info        : { info: 'This is a description of my host.', param},
            apps        : []
        };
        hostMeta.info = hostMeta.info || { foo : 'bar' };
        this.hostName = hostMeta.name;
        
        this.conn = new NetworkConn(
            host,
            sessionId,
            eventSink, // events that do not have a registered listener get sent here
            onOpen,
            onEnd,
            hostMeta
        );
        
        thisIsSelf = this;
        
        this.conn.on( 'connect', connectRequest );
        this.conn.on( 'disconnect', remoteDisconnected );
        
        function connectRequest( data, hostId )
        {
            console.log( 'connectRequest', {
                data: data,
                hostId: hostId
            } );
        }
        
        function remoteDisconnected( data, hostId )
        {
            console.log( 'handleRemoteDisconnected', {
                data: data,
                hostId: hostId,
            } );
        }
        
        function eventSink( type, data, source )
        {
            console.log( 'FriendNetwork - unhandled network event', {
                type: type,
                data: data,
                sourceHost: source,
            } );
        }
        
        function onOpen( networkId ) // self hostId
        {
            FriendNetwork.networkId = networkId;
            console.log( 'FriendNetwork - connection is open', networkId );
        }
        
        function onEnd( e )
        {
            // network connection has given up trying to reconnect
            // .reconnect() not yet implemented
            console.log( 'FriendNetwork.conn onEnd', e );
        }
        
    },
    
    // Closes the current connection
    close: function( )
    {
        if ( this.conn )
        {
            for ( var key in this.sessions )
            {
                if ( this.sessions[ key ] )
                {
                    this.sessions[key].close( true );
                }
            }
            this.conn.close();
            this.conn = false;
            this.networkId = false;
            this.sessions = [ ];
        }
    },
    
    // Closes all Connexions related to one application
    closeApplication: function( msg )
    {
        if ( this.conn )
        {
            for ( var key in this.sessions )
            {
                if ( this.sessions[ key ].applicationId == msg.applicationId )
                {
                    this.sessions[ key ].close();
                }
            }
            this.sessions = this.cleanKeys( this.sessions );
        }
    },
    
    // Grabs important information from the origin message
    getMessageInfo: function( msg )
    {
        var info = { };
        if ( msg && msg.message && msg.message.applicationId )
        {
            info.view = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
            info.applicationId = msg.message.applicationId;
            if ( msg.applicationName )
                info.applicationName = msg.applicationName;
            info.viewId = msg.message.viewId;
        }
        return info;
    },
    
    // Lists the available hosts
    listHosts: function( msg )
    {
        if ( ! this.conn )
            return;
        var messageInfo = this.getMessageInfo( msg );
        
        this.conn.getHosts( hostsBack );
        function hostsBack( err, response )
        {
            console.log( 'hostsBack', err, response );
            if ( err )
            {
                console.log( 'FriendNetwork.list', err, response ? response : '' );
                FriendNetwork.sendErrorToWindow( messageInfo, msg.callback, 'ERR_LIST_HOSTS', false, response );
                return;
            }
            
            var nmsg =
            {
                hosts: response
            };
            FriendNetwork.sendToWindow( messageInfo, msg.callback, 'list', nmsg );
        }
    },

    // Starts hosting session
    startHosting: function( msg )
    {
        if ( ! this.conn )
            return;
        var messageInfo = this.getMessageInfo( msg );
        
        for ( var a in this.hosts )
        {
            if ( this.hosts[ a ].name == msg.name )
            {
                console.log( 'FriendNetwork.startHosting', 'ERR_HOST_ALREADY_EXISTS', msg.name );
                this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_ALREADY_EXISTS', false, msg.name );
                return;
            }
        }

        // Creates new FNetHost object
        var key = this.addSession( msg.name );
        this.sessions[ key ] = new FNetHost( key, messageInfo, msg.name, msg.connectionType, msg.description, msg.data, msg.callback );
    },
    
    // File transfer functions (host side)
    initFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.initFileTransfer( msg.onOff, msg.infos );
        }
        else
        {
            console.log( 'FriendNetwork.initFileTransfer', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    refuseFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var session = this.sessions[ msg.key ];
        if ( session && session.isClient )
        {
            session.refuseFileTransfer( msg.accept, msg.infos );
        }
        else
        {
            console.log( 'FriendNetwork.acceptFileTransfer', 'ERR_HOST_NOT_FOUND' );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    authoriseFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.authoriseFileTransfer( msg.list, msg.infos );
        }
        else
        {
            console.log( 'FriendNetwork.authoriseFileTransfer', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    
    // File transfer functions (client side)
    demandFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.demandFileTransfer( msg.list, msg.infos, msg.finalResponse );
        }
        else
        {
            console.log( 'FriendNetwork.demandFileTransfer', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    acceptFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var session = this.sessions[ msg.key ];
        if ( session && session.isClient )
        {
            session.acceptFileTransfer( msg.transferId, msg.accept, msg.infos );
        }
        else
        {
            console.log( 'FriendNetwork.acceptFileTransfer', 'ERR_HOST_NOT_FOUND' );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    
    // Deletes all the files received from a transfer
    deleteTransferedFiles: function( msg )
    {
        if ( ! this.conn )
            return;
        
        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.deleteTransferedFiles( msg.transferId );
        }
        else
        {
            console.log( 'FriendNetwork.sendFiles', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },

    // Closes a file transfer after completion
    closeFileTransfer: function( msg )
    {
        if ( ! this.conn )
            return;

        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.closeFileTransfer( msg.transferId );
        }
        else
        {
            console.log( 'FriendNetwork.sendFiles', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },
    
    // Sends a set of files to a host
    transferFiles: function( msg )
    {
        if ( ! this.conn )
            return;

        var messageInfo = this.getMessageInfo( msg );
        var session = this.sessions[ msg.key ];
        if ( session && ( session.isClient || session.isHostClient ) )
        {
            session.transferFiles( msg.list, msg.destinationPath, msg.finalResponse );
        }
        else
        {
            console.log( 'FriendNetwork.sendFiles', 'ERR_HOST_NOT_FOUND' );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },


    // Called by the session
    doCloseFileTransfer: function( self, transferId, messageInfo, callback )
    {
        self.fileTransfers[ transferId ] = false;
        self.fileTransfers = FriendNetwork.cleanKeys( self.fileTransfers );
    },

    doDeleteTransferedFiles: function( self, transferId, messageInfo, callback )
    {
        var transfer = self.fileTransfers[ transferId ];
        if ( transfer )
        {
            for ( var f = 0; f < transfer.loaded.length; f++ )
            {
                var file = transfer.loaded[ f ];
                if ( file.saved )
                {
                    FriendDOS.deleteFiles( file.path, { recursive: false }, function()
                    {
                        var msg = 
                        {
                            hostKey: self.host.key,
                            key: self.key,


                            name: self.distantName,
                            transferId: message.transferId,
                            response: 'deleted'
                        };
                        FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );
                    }, 0 );
                }
            }
            self.fileTransfers[ transferId ] = false;
            self.fileTransfers = FriendNetwork.cleanKeys( self.fileTransfers );
        }
    },
    doTransferFiles: function( self, list, destinationPath, finalResponse, messageInfo, callback )
    {
        // Does this side authorise file transfers?
        if ( !self.fileTransfersOn )
        {
            // Send a 'denied' message
            console.log( 'FriendNetwork file transfer denied.' );
            var message =
            {
                command: 'friendnetwork',
                subCommand: 'fileTransfer',
                response: 'denied'
            };
            self.send( message, callback );

            // Send a message to the window indicating the demand
            message = 
            {
                response: 'fileTransferDenied',
                key: self.key
            };
            FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );
            return;
        }

        self.fileTransfersAccepted = false;
        
        if ( list.length == 0 )
            return;
        if ( typeof finalResponse == 'undefined' )
            finalResponse = 'transferEnd';
        if ( typeof destinationPath == 'undefined' )
            destinationPath = 'Home:';
    
        var files = [];        
        var filesNumber = list.length;
        var timeBase = new Date().getTime();
        var timeStart = timeBase;
        var fileDef;
        var transferId = FriendNetwork.hostName + '/' + self.fileTransfersCount++;
        
        // Get the files already loaded
        var fileId = 0;
        var totalProgress = 0;
        for ( var l = 0; l < list.length; l++ )
        {
            fileDef = list[ l ];
            if ( fileDef && fileDef.data )
            {
                var base64 = FriendNetwork.atob( fileDef.data );
                files[ fileId ] = 
                { 
                    name: fileDef.name, 
                    data: base64, 
                    dataSize: base64.length,
                    fileSize: fileDef.data.length,
                    sourcePath: fileDef.path,
                    info: typeof fileDef.info != 'undefined' ? fileDef.info : '',
                    destinationPath: typeof fileDef.destinationPath == 'undefined' ? destinationPath : fileDef.destinationPath,
                    position: 0,
                    chunkNumber: 0,
                    fileId: fileId,
                    sending: false,
                    done: false
                };
                totalProgress += base64.length;
                fileId++;
            }
        }

        // Load the files
        for ( var l = 0; l < list.length; l++ )
        {
            var fileDef = list[ l ];
            if ( fileDef && !fileDef.data )
            {
                var file = new File( fileDef.path );
                file.fileId = fileId;
                file.fileDef = fileDef;
                file.onLoad = function( data )
                {
                    var base64 = FriendNetwork.atob( data );
                    files[ this.fileId ] = 
                    { 
                        name: this.fileDef.name, 
                        data: base64, 
                        dataSize: base64.length,
                        info: typeof this.fileDef.info != 'undefined' ? this.fileDef.info : '',
                        sourcePath: this.fileDef.path,
                        destinationPath: typeof this.fileDef.destinationPath == 'undefined' ? destinationPath : this.fileDef.destinationPath,
                        fileSize: data.length,
                        position: 0,
                        chunkNumber: 0,
                        fileId: this.fileId,
                        sending: false,
                        done: false
                    }
                    timeStart = new Date().getTime();
                    totalProgress += base64.length;
                };
                file.load();
                fileId++;
            }
        }

        // Send start of transfer to the other side
        console.log( 'FriendNetwork file transfer acceptation demand sent.' );
        var infosCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( self.fileTransferInfos ), Workspace.encryption.keys.   publickey );
        var message =
        {
            command: 'friendnetwork',
            subCommand: 'fileTransfer',
            response: 'newTransfer',
            transferId: transferId,
            files: list,
            infos: self.infosCrypted,
            publicKey: Workspace.encryption.keys.client.publickey
        };
        self.send( message, callback );
        
        // Sends message to window
        message = 
        {
            response: 'startTransfer',
            key: self.key,
            transferId: message.transferId
        };
        FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );

        // Distillates the files through time to avoid overloading the server
        var currentProgress = 0;
        var handle = setInterval( sendFile, 20 );        // Every 1/50th of second
        function sendFile()
        {
            // The transfer has been refused?
            if ( self.fileTransfersAccepted == 'refuse' )
            {
                // Indicates to destination
                var message =
                {
                    command: 'friendnetwork',
                    subCommand: 'fileTransfer',
                    response: 'refused',
                    transferId: transferId
                };
                self.send( message, callback );
                clearTimeout( handle );
            }
            else if ( self.fileTransfersAccepted == 'accept' ) 
            {
                // How many files are we sending?
                var sendingNow = 0;
                for ( var f = 0; f < files.length; f++ )
                {
                    if ( files[ f ] && files[ f ].sending )		
                        sendingNow++;
                }
        
                // A slot for a new ones?
                if ( sendingNow < FriendNetwork.TRANSFERMAX )
                {
                    for ( var f = 0; f < files.length; f++ )
                    {
                        file = files[ f ];
                        if ( file && !file.sending && !file.done )
                        {
                            file.sending = true;
        
                            // Sends a "newfile" message
                            file.numberOfChunks = Math.floor( file.dataSize / FriendNetwork.CHUNKSIZE );
                            if ( file.numberOfChunks * FriendNetwork.CHUNKSIZE < file.dataSize )
                                file.numberOfChunks++;
                            var message =
                            {
                                command: 'friendnetwork',
                                subCommand: 'fileTransfer',
                                response: 'newFile',
                                transferId: transferId,
                                fileName: file.name,
                                fileInfo: file.info,
                                fileSourcePath: file.sourcePath,
                                fileId: file.fileId,
                                fileSize: file.fileSize,
                                dataSize: file.dataSize,
                                numberOfChunks: file.numberOfChunks,
                                destinationPath: file.destinationPath
                            };
                            self.send( message, callback );
                            
                            // Sends message to window
                            var message = 
                            {
                                response: 'newFileUpload',
                                key: self.key,
                                transferId: message.transferId,
                                fileId: file.fileId
                            };
                            FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );

                            // Send another file?
                            sendingNow++;
                            if ( sendingNow >= FriendNetwork.TRANSFERMAX )
                                break;
                        }
                    }			
                }
        
                // Send the files in chunks
                for ( var f = 0; f < files.length; f++ )
                {
                    file = files[ f ];
                    if ( file && file.sending )
                    {                    
                        // Size of the chunk to send
                        var last = false;
                        var size = FriendNetwork.CHUNKSIZE;
                        if ( file.position + size > file.dataSize )
                        {
                            // The last chunk!
                            size = file.dataSize - file.position;
                            file.done = true;
                            file.sending = false;
                            last = true;
                            console.log( 'FriendNetwork.sendFiles sent sucessfully ' + file.name + ', path: ' + file.info );
                        }
                        var message =
                        {
                            command: 'friendnetwork',
                            subCommand: 'fileTransfer',
                            response: 'newChunk',
                            transferId: transferId,
                            fileId: file.fileId,
                            chunk: file.chunkNumber,
                            data: file.data.substr( file.position, size ),
                            last: last
                        };
                        self.send( message, callback );
                        file.chunkNumber++;
                        file.position += size;

                        // Sends message to window
                        currentProgress += size;
                        var message = 
                        {
                            response: 'fileUploadProgress',
                            key: self.key,
                            transferId: transferId,
                            fileId: file.fileId,
                            fileProgress: ( file.position / file.dataSize ) * 100,
                            totalProgress: ( totalProgress / currentProgress ) * 100
                        };
                        FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );                    
                    }
                }
        
                // Are we through?
                var doneCount = 0;
                for ( var f = 0; f < files.length; f++ )
                {
                    if ( files[ f ] && files[ f ].done )
                        doneCount++;
                }
                if ( doneCount == filesNumber )
                {
                    // Indicates to destination
                    var message =
                    {
                        command: 'friendnetwork',
                        subCommand: 'fileTransfer',
                        response: finalResponse,
                        transferId: transferId
                    };
                    self.send( message, callback );

                    // Sends message to window
                    var message = 
                    {
                        response: 'completed',
                        key: self.key,
                        transferId: transferId
                    };
                    FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );                    
                    clearInterval( handle );
                    return;
                }
            }    
            
            // Checks timeout
            var delay = new Date().getTime() - timeStart;
            if ( delay > FriendNetwork.TIMEOUT )
            {
                // Indicates to destination
                var message =
                {
                    command: 'friendnetwork',
                    subCommand: 'fileTransfer',
                    response: 'error',
                    transferId: transferId                    
                };
                self.send( message, callback );

                // Sends message to window
                var message = 
                {
                    response: 'error',
                    key: self.key,
                    transferId: transferId
                };
                FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', message );                    
                
                // Outputs to console
                console.log( 'FriendNetwork.sendFiles timeout.' );
                for ( var f = 0; f < files.length; f++ )
                {
                    file = files[ f ];
                    if ( file && !file.done )
                    {
                        console.log( 'Not sent: ' + file.name + ', path: ' + file.path );
                    }
                }

                // Clears transfer
                clearInterval( handle );
            }
        }
    },
    doReceiveFiles: function( self, message, messageInfo, callback )    
    {
        switch ( message.response )
        {
            case 'newTransfer':

                // Creates the entry in the list of current transfers
                self.fileTransfers[ message.transferId ] =
                {
                    transferId: message.transferId,
                    files: [],
                    loaded: [],
                    filesNumber: message.files.length,
                    destinationPath: message.destinationPath,
                    timeBase: new Date().getTime(),
                    filesSaved: 0,
                    totalLoaded: 0,
                    totalSize: 100  // TODO!
                }

                // Send message to window, for application and user to accept
                self.distantPublicKey = message.publicKey;
                var infos = Workspace.encryption.decrypt( message.infos, message.publicKey );
                var msg = 
                {
                    response: 'newTransfer',
                    key: self.key,
                    filesNumber: message.filesNumber,
                    transferId: message.transferId,
                    infos: infos,
                    publicKey: message.publicKey
                };
                FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );

                // Set-up a watch-dog for timeout
                var transfer = self.fileTransfers[ message.transferId ];
                transfer.timeoutHandle = setInterval( checkTimeout, 500 );
                function checkTimeout()
                {
                    var time = new Date().getTime();
                    if ( time - transfer.timeBase > FriendNetwork.TIMEOUT )
                    {
                        // Send timeout message to window
                        var msg = 
                        {
                            response: 'timeout',
                            key: self.key,
                            transferId: transfer.transferId
                        };
                        FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );

                        // Clears timeout
                        clearInterval( transfer.timeoutHandle );
                        transfer.timeoutHandle = false;

                        // Removes the transfer
                        self.fileTransfers[ transfer.transferId ] = false;
                        self.fileTransfers = FriendNetwork.cleanKeys( self.fileTransfers );
                    }
                }
                break;

            case 'newFile':
                var transfer = self.fileTransfers[ message.transferId ];
                if ( transfer )
                {
                    // Updates the timeout
                    transfer.timeBase = new Date().getTime();
                    
                    // A new file!
                    transfer.files[ message.fileId ] =
                    {
                        fileId: message.fileId,
                        fileName: message.fileName,
                        filePath: message.destinationPath,
                        fileInfo: message.fileInfo,
                        fileSourcePath: message.fileSourcePath,
                        size: message.dataSize,
                        numberOfChunks: message.numberOfChunks,
                        map: [],
                        saved: false,
                        loaded: 0
                    };
                    var file = transfer.files[ message.fileId ];
                    for ( var c = 0; c < transfer.numberOfChunks; c++ )
                        file.map[ c ] = false;

                    // Inform the window
                    var msg = 
                    {
                        response: 'newFileDownload',
                        key: self.key,
                        transferId: message.transferId,
                        fileId: message.fileId,
                        fileName: message.fileName,
                        fileSize: message.fileSize,
                        filePath: message.destinationPath,
                        fileSourcePath: message.fileSourcePath,
                        fileInfo: message.fileInfo,
                        fileChunks: message.numberOfChunks
                    };
                    FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );                                    
                }
                break;

            case 'newChunk':
                var transfer = self.fileTransfers[ message.transferId ];
                if ( transfer )
                {
                    // Updates the timeout
                    transfer.timeBase = new Date().getTime();

                    var file = transfer.files[ message.fileId ];
                    if ( file )
                    {
                        // Stores in the map
                        file.map[ message.chunk ] = message.data;

                        // Send information to the caller
                        file.loaded += message.data.length;
                        transfer.totalLoaded += message.data.length;
                        var msg = 
                        {
                            response: 'fileDownloadProgress',
                            key: self.key,
                            transferId: message.transferId,
                            fileName: file.fileName,
                            filePath: file.filePath + file.name,                            
                            fileId: message.fileId,
                            fileData: message.data,
                            fileCompleted: message.last,
                            fileProgress: ( file.loaded / file.size ) * 100,
                            fileInfo: file.fileInfo,        
                            fileSourcePath: file.fileSourcePath,                                
                            totalProgress: ( transfer.totalSize / transfer.totalLoaded ) * 100
                        };
                        FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );                                    

                        // The last chunk! The file is ready
                        var count = 0;
                        for ( var c = 0; c < file.numberOfChunks; c++ )
                        {
                            if ( file.map[ c ] )
                                count++;
                        }
                        if ( count == file.numberOfChunks )
                        {
                            var wholeFile = '';
                            for ( var c = 0; c < file.map.length; c++ )
                            {
                                wholeFile += file.map[ c ];
                            }
                            wholeFile = FriendNetwork.btoa( wholeFile );

                            /*
                            // Verification of the file, transmit hash!
                            if ( wholeFile.length > 5000 )
                            {
                                var load = new File( '/webclient/apps/Panzers/Shared/image.png' );
                                load.wholeFile = wholeFile;
                                load.onLoad = function( data )
                                {
                                    var s1 = this.wholeFile.length;
                                    var s2 = data.length;
                                    for ( var b = 0; b < this.wholeFile.length; b++ )
                                    {
                                        if ( this.wholeFile.charCodeAt( b ) != data.charCodeAt( b ) )
                                            debugger;
                                    }
                                    for ( var b = 0; b < data.length; b++ )
                                    {
                                        if ( this.wholeFile.charCodeAt( b ) != data.charCodeAt( b ) )
                                            debugger;
                                    }
                                    debugger;
                                };
                                load.load( 'rb' );
                            }
                            */
                            
                            // Saves the file, and store in the list of files
                            var save = new File( file.filePath + file.fileName );
                            save.transferedFile = file;
                            save.onSave = function( response )
                            {
                                file.saved = true;
                                transfer.filesSaved++;
                                transfer.loaded.push( 
                                {
                                    fileId: this.transferedFile.fileId,
                                    fileName: this.transferedFile.fileName,
                                    filePath: this.transferedFile.filePath + this.transferedFile.fileName,
                                    fileInfo: this.transferedFile.fileInfo,
                                    fileSourcePath: this.transferedFile.fileSourcePath
                                } );
                            };
                            save.save( wholeFile );
                        }
                    }
                }
                break;

            case 'error':
                var transfer = self.fileTransfers[ message.transferId ];
                if ( transfer )
                {
                    var msg =
                    {
                        key: self.key,
                        response: message.response,
                        transferId: message.transferId,
                        list: transfer.loaded,
                        time: new Date().getTime() - transfer.timeBase
                    };                
                    FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );
                }
                break;

            default:
                // case 'end':            
                var handle = setInterval( testEnd, 100 );
                function testEnd()
                { 
                    var transfer = self.fileTransfers[ message.transferId ];
                    if ( transfer )
                    {
                        // All files saved?
                        if ( transfer.filesSaved == transfer.filesNumber )
                        {
                            // Clears the timeout handle (file may take time to save)
                            if ( transfer.timeoutHandle )
                            {
                                clearInterval( transfer.timeoutHandle );
                                transfer.timeoutHandle = false;
                            }

                            // Send a message to the window
                            var msg = 
                            {
                                key: self.key,
                                response: message.response,
                                transferId: message.transferId,
                                list: transfer.loaded,
                                time: new Date().getTime() - transfer.timeBase
                            };
                            FriendNetwork.sendToWindow( messageInfo, callback, 'fileTransfer', msg );
                            clearInterval( handle );
                        }
                    }
                }
                break;
        }
    },

    // Dispose hosting session (from its name)
    disposeHosting: function( msg )
    {
        if ( ! this.conn )
            return;

        if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
        {
            this.sessions[ msg.key ].close();
            this.sessions = this.cleanKeys( this.sessions );
        }
        else
        {
            console.log( 'FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND' );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.name );
        }
    },

    // Dispose hosting session (from its name)
    concealHost: function( msg )
    {
        if ( ! this.conn )
            return;

        if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
        {
            this.sessions[ msg.key ].conceal();
        }
        else
        {
            console.log( 'FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND' );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.name );
        }
    },

    // Connect to distant host
    connectToHost: function( msg )
    {
        if ( ! this.conn )
            return;
        var messageInfo = this.getMessageInfo( msg );

        var url = msg.url;
        var userName;
        var hostName;
        var appName;
        var path = '';

        // Get server, user and host names
        var start = url.indexOf( '@' );
        if ( start < 0 )
        {
            // Only a host name
            hostName = url;
        }
        else
        {
            hostName = url.substring( 0, start );
            userName = url.substring( start + 1 );
        }

        // Do the connection!
        var hostType = msg.hostType;
        
        this.conn.getHosts( hostsBack );

        // Return of the getHost function
        function hostsBack( err, response )
        {
            var found = false;
            if ( ! err )
            {
                for ( var a = 0; a < response.length; a ++ )
                {
                    if ( userName && userName != response[a].name )
                        continue;
                    var apps = response[a].apps;
                    if ( apps )
                    {
                        for ( var b = 0; b < apps.length; b ++ )
                        {
                            found = true;
                            var foundHost = apps[ b ];
                            if ( hostType )
                            {   
                                found = false;
                                if ( hostType == foundHost.type );
                                    found = true;
                            }
                            if ( found && appName )
                            {
                                found = false;
                                var position = foundHost.name.indexOf( appName );
                                if ( position >= 0 )
                                {
                                    found = true;
                                    foundHost = foundHost.substring( 0, position ) + foundHost.substring( position + appName.length );                                    
                                }
                            }
                            if ( found && foundHost.name == hostName )
                            {
                                found = true;
                                var key = FriendNetwork.addSession( msg.message.applicationId );
                                FriendNetwork.sessions[ key ] = new FNetClient
                                (
                                    key,
                                    messageInfo,
                                    response[a].hostId,
                                    apps[b].id,
                                    apps[b].name + '@' + response[a].name,
                                    msg.p2p,
                                    msg.callback
                                );
                                break;
                            }
                        }
                    }
                }
            }
            else
            {
                console.log( 'FriendNetwork.connectToHost.hostBack', err, response ? response : '' );
                FriendNetwork.sendErrorToWindow( messageInfo, msg.message.callback, err, false, response );
                return;
            }
            if ( !found )
            {
                console.log( 'FriendNetwork.connectToHost', 'ERR_HOST_NOT_FOUND', msg.name );
                FriendNetwork.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', false, msg.name );
            }
        }
    },

    disconnectFromHost: function( msg )
    {
        if ( ! this.conn )
            return;

        var session = FriendNetwork.sessions[ msg.key ];
        if ( session && session.isClient )
        {
            session.close();
            this.sessions = this.cleanKeys( this.sessions );
        }
        else
        {
            console.log( 'FriendNetwork.disconnectFromHost', 'ERR_CLIENT_NOT_FOUND', msg.name );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_CLIENT_NOT_FOUND', msg.key );
        }
    },

    // Set the host password
    setHostPassword: function( msg )
    {
        var session = this.sessions[ msg.key ];
        if ( session && session.isHost )
        {
            if ( typeof msg.password == 'string' )
                session.password = 'HASHED' + Sha256.hash( msg.password );
            else
                session.password = msg.password;
        }
        else
        {
            console.log( 'FriendNetwork.setHostPassword', 'ERR_HOST_NOT_FOUND', msg.key );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },

    // Send the credentials to host
    sendCredentials: function( msg )
    {
        if ( ! this.conn )
            return;

        var session = this.sessions[ msg.key ];
        if ( session && session.isClient )
        {
            session.sendCredentials( msg.password );
        }
        else
        {
            console.log( 'FriendNetwork.sendCredentials.send', 'ERR_HOST_NOT_FOUND' );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
        }
    },

    // Send data to distant host (from the key)
    send: function( msg )
    {
        if ( ! this.conn )
            return;

        var sent = false;
        var session = this.sessions[ msg.key ];
        if ( session )
        {
            if ( session.isClient || session.isHostClient )
            {
                sent = true;
                session.send( msg.data );
            }
        }
        if ( ! sent )
        {
            console.log( 'FriendNetwork.send - ERR_SESSION_NOT_FOUND',
            {
                msg: msg,
                sessions: this.sessions,
            } );
            var messageInfo = this.getMessageInfo( msg );
            this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_SESSION_NOT_FOUND', msg.key );
        }
    },
/*
    // Timeout function
    handleTimeout: function()
    {
        if ( ! this.conn )
            return;

        for ( var key in FriendNetwork.sessions )
        {
            var session = FriendNetwork.sessions[ key ];

            if ( session.isHostClient )
            {
                // Connexion timeout?
                session.countDown --;
                if ( session.countDown == 0 )
                {
                    console.log( 'FriendNetwork.timeout hostClient timeout' );

                    // Send message to host view
                    var hostApplication = findApplication( session.localAppId );
                    var view = GetContentWindowByAppMessage( hostApplication, session.localAppId );
                    var msg = {
                        command: 'friendnetwork',
                        subCommand: 'timeout',
                        key: session.key,
                        hostKey: session.hostKey,
                        name: session.distantName,
                        appName: session.distantAppName
                    };
                    FriendNetwork.sendToWindow( view, session.localAppId, session.host.callback, 'timeout', msg );
                    session.close( true );
                }

                // Send a ping message to client every second
                session.countDown = 10;
                FriendNetwork.conn.send( session.distantId,
                {
                    type: session.distantKey,
                    data: {
                        command: 'ping',
                        key: session.key
                    }
                },
                function( err, data )
                {
                    console.log( 'FriendNetwork.timeout sent ping ', err, data );
                } );
            }
        }
    },
*/
    // Send error message to view
    sendErrorToWindow: function( messageInfo, callback, error, key, response )
    {
        var message =
        {
            command: 'friendnetwork',
            subCommand: 'error',
            error: error,
            key: key,
            response: response
        };
        if ( typeof callback == 'function' )
        {
            callback( message );
        }
        if ( messageInfo )
        {
            if ( typeof callback == 'string' )
            {
                message.type = 'callback';
                message.callback = callback;
            }
            message.applicationId = messageInfo.applicationId;
            message.viewId = messageInfo.viewId;
            messageInfo.view.postMessage( JSON.stringify( message ), '*' );
        }
    },
    // Send message to view
    sendToWindow: function( messageInfo, callback, subCommand, message )
    {
        message.command = 'friendnetwork';
        message.subCommand = subCommand;
        if ( typeof callback == 'function' )
        {
            callback( msg );
        }
        if ( messageInfo.view )
        {
            if ( typeof callback == 'string' )
            {
                message.type = 'callback';
                message.callback = callback;
            }
            message.applicationId = messageInfo.applicationId;
            message.viewId = messageInfo.viewId;
            messageInfo.view.postMessage( JSON.stringify( message ), '*' );
        }
    },

    // Returns a unique key
    addKey: function( keys, id )
    {
        var key = id + '-' + Math.random() * 999999;
        while( typeof( keys[ key ] ) != 'undefined' )
            key = id + '-' + Math.random() * 999999;
        keys[ key ] = true;
        return key;
    },

    // Cleans a key array
    cleanKeys: function( keys )
    {
        var out = [ ];
        for ( var key in keys )
        {
            if ( keys[ key ] )
                out[ key ] = keys[ key ];
        }
        return out;
    },

    // Add a new session by applicationid and name
    addSession: function( id )
    {
        return this.addKey( this.sessions, id );
    },

    // Remove a session by key
    removeSession: function( key )
    {
        if ( this.sessions[ key ] )
        {
            this.sessions[ key ] = false;
            this.sessions = this.cleanKeys( this.sessions );
        }
    },
    getSessionKeyFromName: function( name )
    {
        for ( var key in this.sessions )
        {
            if ( this.sessions[ key ].name == name )
                return key;
        }
        return false;
    },
    keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode:function(e)
    {
        var t="";
        var n,r,i,s,o,u,a;
        var f=0;
        e=FriendNetwork.utf8_encode(e);
        while(f<e.length)
        {
            n=e.charCodeAt(f++);
            r=e.charCodeAt(f++);
            i=e.charCodeAt(f++);
            s=n>>2;o=(n&3)<<4|r>>4;
            u=(r&15)<<2|i>>6;a=i&63;
            if(isNaN(r))
            {
                u=a=64
            }
            else if(isNaN(i))
            {
                a=64
            }
            t=t+FriendNetwork.keyStr.charAt(s)+FriendNetwork.keyStr.charAt(o)+FriendNetwork.keyStr.charAt(u)+FriendNetwork.keyStr.charAt(a);
        }
        return t;
    },
    decode:function(e)
    {
        var t="";
        var n,r,i;
        var s,o,u,a;
        var f=0;
        e=e.replace(/[^A-Za-z0-9+/=]/g,"");
        while(f<e.length)
        {
            s=FriendNetwork.keyStr.indexOf(e.charAt(f++));o=FriendNetwork.keyStr.indexOf(e.charAt(f++));
            u=FriendNetwork.keyStr.indexOf(e.charAt(f++));a=FriendNetwork.keyStr.indexOf(e.charAt(f++));
            n=s<<2|o>>4;
            r=(o&15)<<4|u>>2;
            i=(u&3)<<6|a;
            t=t+String.fromCharCode(n);
            if(u!=64)
            {
                t=t+String.fromCharCode(r)
            }
            if(a!=64)
            {
                t=t+String.fromCharCode(i)
            }
        }
        t=FriendNetwork.utf8_decode(t);
        return t;
    },
    utf8_encode:function(e)
    {
        e=e.replace(/rn/g,"n");
        var t="";
        for(var n=0;n<e.length;n++)
        {
            var r=e.charCodeAt(n);
            if(r<128)
            {
                t+=String.fromCharCode(r)
            }
            else if(r>127&&r<2048)
            {
                t+=String.fromCharCode(r>>6|192);
                t+=String.fromCharCode(r&63|128)
            }
            else
            {
                t+=String.fromCharCode(r>>12|224);
                t+=String.fromCharCode(r>>6&63|128);
                t+=String.fromCharCode(r&63|128)
            }
        }
        return t
    },
    utf8_decode:function(e)
    {
        var t="";
        var n=0;
        var r=c1=c2=0;
        while(n<e.length)
        {
            r=e.charCodeAt(n);
            if(r<128)
            {
                t+=String.fromCharCode(r);
                n++
            }
            else if(r>191&&r<224)
            {
                c2=e.charCodeAt(n+1);
                t+=String.fromCharCode((r&31)<<6|c2&63);
                n+=2
            }
            else
            {
                c2=e.charCodeAt(n+1);
                c3=e.charCodeAt(n+2);
                t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);
                n+=3
            }
        }
        return t
    },
    btoa: function( source ) 
    {
        return FriendNetwork.decode( source );
    },      
    atob: function( source ) 
    {
        return FriendNetwork.encode( source );
    },
    // Get online status of a session / the network
    getStatus: function( msg, callback )
    {
        var result =
        {
            connected: false,
            hosts: [ ],
            clients: [ ]
        };
        if ( this.conn )
        {
            result.connected = true;

            // Gather all the hosts
            for ( var key in this.sessions )
            {
                var session = this.sessions[key];
                if ( session.isHost )
                {
                    result.hosts.push(
                    {
                        key: session.key,
                        name: session.name,
                        applicationId: session.applicationId,
                        applicationName: session.applicationName,
                        hosting: [ ]
                    } );
                }
            }

            // Gather all the sessions hosted by each host
            for ( var key in this.sessions )
            {
                var session = this.sessions[key];
                if ( session.isHostClient )
                {
                    for ( var a = 0; a < result.hosts.length; a ++ )
                    {
                        if ( result.hosts[a].key == session.hostKey )
                        {
                            result.hosts[a].hosting.push(
                            {
                                key: session.key,
                                distantName: session.distantName,
                                distantAppName: session.distantAppName
                            } );
                        }
                    }
                }
            }

            // Gather all the clients
            for ( var key in this.sessions )
            {
                var session = this.sessions[key];
                if ( session.isClient )
                {
                    result.clients.push(
                    {
                        key: session.key,
                        hostName: session.hostName,
                        applicationId: session.applicationId,
                        distantAppName: session.distantAppName
                    } );
                }
            }
        }

        // Send results to view
        var messageInfo = this.getMessageInfo( msg );
        var nmsg =
        {
            connected: result.connected,
            hosts: result.hosts,
            clients: result.clients
        };
        FriendNetwork.sendToWindow( messageInfo, callback, 'status', nmsg );
    }
};
FriendNetwork.TRANSFERMAX = 2;				// Number of files to send at the same time
FriendNetwork.CHUNKSIZE = 512;			    // Ask Espen how low it should be!
FriendNetwork.TIMEOUT = 1000 * 1000;		// Timeout 

// FriendNetwork host object
FNetHost = function( key, messageInfo, name, type, description, data, callback )
{
    var self = this;
    self.key = key;
    self.messageInfo = messageInfo;
    self.applicationId = messageInfo.applicationId;
    self.applicationName = messageInfo.applicationName;
    self.name = name + '@' + FriendNetwork.hostName;
    self.description = description;
    self.isHost = true;
    self.callback = callback;
    self.hostClients = [ ];
    if ( data )
    {
        self.data = data;
        if ( typeof data.password == 'string' )
        {
            self.password = 'HASHED' + Sha256.hash( data.password );
            data.password = false;
            self.data = FriendNetwork.cleanKeys( data );
        }
    }

    // Initialize the node
    self.conn = new EventNode( self.key, FriendNetwork.conn, eventSink );
    self.conn.send = function()
    {
        console.log( 'FnetHost.conn.send - dont use this. \
			Use the conn.send in the session for the specific remote app \
			( some instance of FNetHostClient )', arguments );
    };
    FriendNetwork.conn.on( self.key, handleEvents );

    // Initialization of other parameters
    if ( typeof description != 'string' )
        description = '';

    // Broadcast on network
    var app = 
    {
        id          : self.key,
        type        : type,
        name        : name,
        description : description,
        info        : data
    };
    FriendNetwork.conn.expose( app, exposeBack );

    function exposeBack( err, response )
    {
        if ( err )
        {
            console.log( 'FdNethost exposeBack', err, response ? response : '' );
            FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, err, self.key, response );
            FriendNetwork.conn.release( self.key );
            FriendNetwork.removeHost( self.key );
            return;
        }

        var ok = false;
        if ( ! err )
        {
            for ( var a = 0; a < response.length; a ++ )
            {
                if ( response[a].id == self.key )
                {
                    ok = true;
                    var nmsg = 
                    {
                        name: self.name,
                        hostKey: self.key
                    };
                    FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'host', nmsg );
                    break;
                }
            }
        }
        if ( ! ok )
        {
            console.log( 'FNethost exposeBack', err, response ? response : '' );
            FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_HOSTING_FAILED', self.key, response );
            FriendNetwork.conn.release( self.key );
            FriendNetwork.sessions[ self.key ] = false;
            FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
        }
    }

    function handleEvents( data )
    {
        if ( data.command == 'connect' )
        {
            var k = FriendNetwork.addKey( FriendNetwork.sessions, self.key );
            self.hostClients[ k ] = new FNetHostClient( k, self, data );
            FriendNetwork.sessions[ k ] = self.hostClients[ k ];
        }
        else if ( data.type == 'connect' )
        {
            connectRequest( data.data );
        }
        else if ( data.key )
        {
            if ( self.hostClients[ data.key ] )
            {
                self.hostClients[ data.key ].handleEvents( data );
            }
        }
    }

    function eventSink()
    {
        console.log( 'FNetHost - eventsink', arguments );
    }

    // Called in case of peer-to-peer connexion
    function connectRequest( connReq )
    {
        console.log( 'connectRequest', connReq );
        const remoteApp = connReq.data.sourceApp;
        self.hostClients[ remoteApp ] = new FNetHostP2PClient(
        self.key,
        connReq,
        p2pOnEnd,
        self,
        remoteApp
        );
        FriendNetwork.sessions[ remoteApp ] = self.hostClients[ remoteApp ];
        function p2pOnEnd( e )
        {
            console.log( 'p2p ended' );
        }
    }
};
FNetHost.prototype.removeHClient = function( key )
{
    if ( FriendNetwork.sessions[ key ] )
    {
        FriendNetwork.sessions[ key ] = false;
        FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
        this.hostClients[ key ] = false;
        this.hostClients = FriendNetwork.cleanKeys( this.hostClients );
    }
};

FNetHost.prototype.closeClient = function( key, clean )
{
    var self = this;
    if ( self.hostClients[ key ] )
    {
        self.hostClients[ key ].close();
        self.hostClients[ key ] = false;
        FriendNetwork.sessions[ key ] = false;
        if ( clean )
        {
            FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
            self.hostClients = FriendNetwork.cleanKeys( self.hostClients );
        }
    }
};
FNetHost.prototype.conceal = function()
{
    FriendNetwork.conn.conceal( self.key, function( err, response )
    {
        debugger;
    } );
};
FNetHost.prototype.close = function( closingSession )
{
    var self = this;
    if ( closingSession )
    {
        // Close all connected clients
        for ( var key in self.hostClients )
        {
            self.hostClients[ key ].close();
        }
        return;
    }
    FriendNetwork.conn.conceal( self.key, function( err, response )
    {
        if ( err )
        {
            console.log( 'FriendNetwork.close conceal', err, response ? response : '' );
            FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, err, self.key, response );
            return;
        }

        // Close all connected clients
        for ( var key in self.hostClients )
        {
            self.hostClients[ key ].close();
        }
        self.hostClients = FriendNetwork.cleanKeys( self.hostClients );
        FriendNetwork.conn.release( self.key );
        FriendNetwork.sessions[ self.key ] = false;
        FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );

        // Send message to host
        var msg =
        {
            hostKey: self.key,
            name: self.name
        };
        FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'disposed', msg );
    } );
};

// A client of the host
function FNetHostClient( key, host, data )
{
    console.log( 'FNetHostClient', self );
    var self = this;
    self.key = key;
    self.host = host;
    self.applicationId = host.applicationId;
    self.distantId = data.id;
    self.distantKey = data.key;
    self.distantName = data.name;
    self.distantAppName = data.applicationName;
    self.isHostClient = true;
    self.events = [ ];
    self.events[ 'credentials' ] = credentials;
    self.events[ 'clientDisconnected' ] = disconnect;
    self.events[ 'message' ] = message;
    self.fileTransfers = [];
    self.fileTransfersCount = 0;
    self.fileTransfersOn = false;
    self.fileTransferInfos = false;
    self.fileTransfersAccepted = 'none';
    
    self.conn = new EventNode
    (
        self.key,
        FriendNetwork.conn,
        eventSink
    );
    function eventSink()
    {
        console.log( 'FnetHostClient.conn.eventSink', arguments );
    }

    self.credentialCount = 3;
    FriendNetwork.conn.send( self.distantId,
    {
        type: self.distantKey,
        data:
        {
            name: FriendNetwork.hostName,
            hostName: self.host.name,
            applicationName: self.host.applicationName,
            id: FriendNetwork.networkId,
            key: self.key,
            command: 'getCredentials',
            publicKey: Workspace.encryption.keys.client.publickey
        }
    }, function( err, response )
    {
        if ( err )
        {
            console.log( 'FNetClient constructor', err, response ? response : '' );
            FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, err, self.key, response );
            FriendNetwork.removeSession( self.key );
        }
    } );

    self.handleEvents = function( data )
    {
        console.log( 'handleEvents', data );
        if ( data.command )
        {
            if ( self.events[data.command] )
                self.events[ data.command ].apply( self, [ data ] );
            else
                console.log( 'FNetClient eventSink', data );
        }
    };
    function credentials( data )
    {
        var good = false;

        var clientPassword = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );

        // Compare to user's password
        if ( self.host.password )
        {
            // If the password is a string, just compare
            if ( typeof self.host.password == 'string' )
            {
                if ( clientPassword == self.host.password )
                {
                    good = true;
                    self.sessionPassword = false;
                }
            }
            else
            {
                // If it is an object, ask calling app to validate it
            }
        }
        else
        {
            if ( clientPassword == Workspace.loginPassword )
            {
                good = true;
                self.sessionPassword = true;
            }
        }

        if ( ! good )
        {
            self.credentialCount --;
            if ( self.credentialCount == 0 )
            {
                FriendNetwork.conn.send( self.distantId,
                {
                    type: self.distantKey,
                    data: {
                        command: 'failedCredentials',
                        hostKey: self.hostKey,
                        key: self.key
                    }
                }, function( err, response )
                {
                } );
                self.host.removeHClient( self.key );
            }
            else
            {
                // Wrong credentials
                FriendNetwork.conn.send( self.distantId,
                {
                    type: self.distantKey,
                    data: {
                        command: 'wrongCredentials',
                        hostKey: self.hostKey,
                        key: self.key
                    }
                }, function( err, response )
                {
                    console.log( 'FNetHost client', err, response ? response : '' );
                } );
            }
        }
        else
        {
            // Connected!
            FriendNetwork.conn.send( self.distantId, {
                type: self.distantKey,
                data: {
                    command: 'connected',
                    hostKey: self.host.key,
                    key: self.key,
                    sessionPassword: self.sessionPassword
                }
            }, function( err, response )
            {
                console.log( 'FNetHost client', err, response ? response : '' );
            } );

            // Send message to view
            var nmsg = {
                hostKey: self.host.key,
                key: self.key,
                name: self.distantName,
                sessionPassword: self.sessionPassword,
                p2p: false
            };
            FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientConnected', nmsg );
        }
    }
    function disconnect( data )
    {
        // Send message to view
        var nmsg = {
            hostKey: self.host.key,
            key: self.key,
            name: self.distantName
        };
        FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientDisconnected', nmsg );

        // Remove session
        self.host.removeHClient( self.key );
    }
    function message( data )
    {
        var self = this;

        // A file transfer?
        if ( data.data.subCommand == 'fileTransfer' )
        {
            // Waiting for acceptation on the other side
            switch ( data.data.response )
            {
                case ( 'getFiles' ):
                    break;

                case 'acceptFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'authoriseFileTransfer',
                        key: self.key,
                        transferId: data.data.transferId,
                        publicKey: data.data.publicKey,
                        infos: data.data.infos
                    };
                    FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileTransfer', message );
                    break;
                case 'demandFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'demandFileTransfer',
                        key: self.key,
                        publicKey: data.data.publicKey,
                        list: data.data.list,
                        infos: data.data.infos,
                        finalResponse: data.data.finalResponse
                    };
                    FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileTransfer', message );
                    break;
                default:
                    // Transmits to receive routine
                    FriendNetwork.doReceiveFiles( this, data.data, self.host.messageInfo, self.host.callback );
                    break;
            }            
        }
        else
        {
            // Simple message : Send to view
            var nmsg = 
            {
                hostKey: self.host.key,
                key: self.key,
                name: self.distantName,
                data: data.data
            };
            FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'messageFromClient', nmsg );
        }
    }
};
FNetHostClient.prototype.demandFileTransfer = function( list, infos, finalResponse )
{
    if ( !list )
    {
        // I need list of files!
        FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, 'FriendNetwork error', self.key, 'Please provide a list of files.' );        
        return;
    }

    // Sends a message to host
    if ( !infos )
        infos = '';
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'demandFileTransfer',
        infos: infos,
        list: list,
        publicKey: Workspace.encryption.keys.client.publickey,
        finalResponse: finalResponse
    };
    this.send( message );
};
FNetHostClient.prototype.initFileTransfer = function( onOff, infos )
{
    if ( !infos )
        infos = '';
    self.fileTransfersInfos = infos;
    self.fileTransfersOn = onOff;
};
FNetHostClient.prototype.authoriseFileTransfer = function( response, transferId )
{
    self.fileTransfersAccepted = response;
};
FNetHostClient.prototype.closeFileTransfer = function( transferId, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doCloseFileTransfer( this, transferId, messageInfo, callback );
};
FNetHostClient.prototype.deleteTransferedFiles = function( transferId, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doDeleteTransferedFiles( this, transferId, messageInfo, callback );
};
FNetHostClient.prototype.transferFiles = function( list, destinationPath, finalResponse, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doTransferFiles( this, list, destinationPath, finalResponse, messageInfo, callback );
};
FNetHostClient.prototype.close = function()
{
    var self = this;
    var nmsg = {
        type: self.distantKey,
        data: {
            command: 'hostDisconnected',
            hostKey: self.hostKey,
            key: self.key,
            name: self.host.name
        }
    };
    FriendNetwork.conn.send( self.distantId, nmsg, function( err, response )
    {
    } );
};
FNetHostClient.prototype.send = function( data )
{
    var self = this;
    var nmsg = 
    {
        type: self.distantKey,
        data: 
        {
            command: 'message',
            hostKey: self.hostKey,
            key: self.key,
            name: self.host.name,
            data: data
        }
    };
    FriendNetwork.conn.send( self.distantId, nmsg, function( err, response )
    {
        if ( err )
        {
            console.log( 'FriendNetwork.send', err, response ? response : '' );
            FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, err, self.key, response );
        }
    } );
};
FNetHostClient.prototype.refuseFileTransfer = function( accept, data )
{
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'refuseFileTransfer'
    };
    this.send( message );
};
FNetHostClient.prototype.acceptFileTransfer = function( transferId, accept, infos )
{
    // Encrypts the data with host public key
    if ( !infos )
        infos = '';
    var infosCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( JSON.stringify( infos ) ), self.distantPublicKey );
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'acceptFileTransfer',
        infos: infosCrypted,
        accept: accept,
        transferId: transferId,
        publicKey: Workspace.encryption.keys.client.publickey
    };
    this.send( message );
};

// A client of the host
function FNetHostP2PClient( netKey, req, onend, host, key )
{
    var self = this;
    console.log( 'FNetHostP2PClient', self );
    var data = req.data;
    self.key = key;
    self.host = host;
    self.applicationId = host.applicationId;
    self.remoteId = data.sourceHost;
    self.remoteKey = data.sourceApp;
    self.isHostClient = true;
    self.events = { };
    self.events[ 'credentials' ] = credentials;
    self.events[ 'clientDisconnected' ] = disconnect;
    self.events[ 'message' ] = message;
    self.fileTransfers = [];
    self.fileTransfersCount = 0;
    self.fileTransfersOn = false;
    self.fileTransferInfos = false;
    self.fileTransfersAccepted = 'none';
    self.distantApplicationName = 'TODO!';

    self.conn = new EventNode
    (
        netKey,
        FriendNetwork.conn
    );

    // Setup event node
    self.conn.send = sendToRemote;
    function sendToRemote( event )
    {
        var toApp = 
        {
            type: self.remoteKey,
            data: event
        };
        console.log( 'sendToRemote', toApp );
        FriendNetwork.conn.send( self.remoteId, toApp );
    }
    var replyId = req.type;
    var reply = 
    {
        accept: true,
        opts: 
        {
            infos: 'hepp!'
        }
    }
    FriendNetwork.conn.request
    (
        replyId,
        reply,
        replyBack
    );

    function replyBack( err, res )
    {
        console.log( 'connect replyBack', 
        {
            e: err,
            r: res
        } );
        self.peer = new Peer
        (
            res,
            self.conn,
            peerEventSink,
            onPeerEnd
        );
        self.peer.on( 'event', handleEvents );

        // Send the getCredentials message
        var msg =
        {
            type: 'event',
            data:
            {
                name: FriendNetwork.hostName,
                hostName: self.host.name,
                applicationName: self.host.applicationName,
                id: FriendNetwork.networkId,
                key: self.key,
                command: 'getCredentials',
                publicKey: Workspace.encryption.keys.client.publickey
            }
        };
        self.peer.send( msg );

        function peerEventSink()
        {
            console.log( 'FNetHostClient peer eventsink', arguments );
        }
        function onPeerEnd( e )
        {
            console.log( 'FNetHostClient onPeerEnd', e );
        }
    }
    function handleEvents( data )
    {
        if ( data.command )
        {
            if ( self.events[ data.command ] )
                self.events[ data.command ].apply( self, [ data ] );
            else
                console.log( 'FNetHostP2PClient eventSink', data );
        }
    }
    function credentials( data )
    {
        var good = false;
        self.distantName = data.name;
        self.distantAppName = data.applicationName;

        var clientPassword = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );

        // Compare to user's password
        if ( self.host.password )
        {
            // If the password is a string, just compare
            if ( typeof self.host.password == 'string' )
            {
                if ( clientPassword == self.host.password )
                {
                    good = true;
                    self.sessionPassword = false;
                }
            }
            else
            {
                // If it is an object, ask calling app to validate it
            }
        }
        else
        {
            if ( clientPassword == Workspace.loginPassword )
            {
                good = true;
                self.sessionPassword = true;
            }
        }

        if ( ! good )
        {
            self.credentialCount --;
            if ( self.credentialCount == 0 )
            {
                var msg =
                {
                    type: 'event',
                    data:
                    {
                        command: 'failedCredentials',
                        hostKey: self.hostKey,
                        key: self.key
                    }
                };
                self.peer.send( msg );
                self.host.removeHClient( self.key );
            }
            else
            {
                // Wrong credentials
                var msg =
                {
                    type: 'event',
                    data:
                    {
                        command: 'wrongCredentials',
                        hostKey: self.hostKey,
                        key: self.key
                    }
                };
                self.peer.send( msg );
            }
        }
        else
        {
            // Connected!
            var msg =
            {
                type: 'event',
                data:
                {
                    command: 'connected',
                    hostKey: self.host.key,
                    key: self.key,
                    sessionPassword: self.sessionPassword
                }
            };
            self.peer.send( msg );

            // Send message to view
            var nmsg =
            {
                hostKey: self.host.key,
                key: self.key,
                name: self.distantName,
                sessionPassword: self.sessionPassword,
                p2p: true
            };
            FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientConnected', nmsg );
        }
    }
    function disconnect( data )
    {
        // Send message to view
        var nmsg =
        {
            hostKey: self.host.key,
            key: self.key,
            name: self.distantName
        };
        FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientDisconnected', nmsg );

        // Remove session
        FriendNetwork.removeSession( self.key );
    }
    function message( data )
    {
        // A file transfer?
        if ( data.data.subCommand == 'fileTransfer' )
        {
            // Waiting for acceptation on the other side
            switch ( data.data.response )
            {
                case 'acceptFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'authoriseFileTransfer',
                        key: self.key,
                        transferId: data.data.transferId,
                        publicKey: data.data.publicKey,
                        infos: data.data.infos
                    };
                    FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileTransfer', message );
                    break;
                case 'demandFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'demandFileTransfer',
                        key: self.key,
                        publicKey: data.data.publicKey,
                        list: data.data.list,
                        infos: data.data.infos,
                        finalResponse: data.data.finalResponse
                    };
                    FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileTransfer', message );
                    break;
                default:
                    // Transmits to receive routine
                    FriendNetwork.doReceiveFiles( this, data.data, self.host.messageInfo, self.host.callback );
                    break;
            }            
        }        
        else
        {
            // Simple message : Send to view
            var nmsg =
            {
                hostKey: self.host.key,
                key: self.key,
                name: self.distantName,
                data: data.data
            };
            FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'messageFromClient', nmsg );
        }
    }
}
FNetHostP2PClient.prototype.initFileTransfer = function( onOff, infos )
{
    if ( !infos )
        infos = '';
    self.fileTransfersInfos = infos;
    self.fileTransfersOn = onOff;
};
FNetHostP2PClient.prototype.authoriseFileTransfer = function( response, transferId )
{
    self.fileTransfersAccepted = response;
};
FNetHostClient.prototype.demandFileTransfer = function( list, infos, finalResponse )
{
    if ( !list )
    {
        // I need list of files!
        FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, 'FriendNetwork error', self.key, 'Please provide a list of files.' );        
        return;
    }

    // Sends a message to host
    if ( !infos )
        infos = '';
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'demandFileTransfer',
        infos: infos,
        list: list,
        publicKey: Workspace.encryption.keys.client.publickey,
        finalResponse: finalResponse
    };
    this.send( message );
};
FNetHostP2PClient.prototype.closeFileTransfer = function( transferId, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doCloseFileTransfer( this, transferId, messageInfo, callback );
};
FNetHostP2PClient.prototype.deleteTransferedFiles = function( transferId, messageInfo )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doDeleteTransferedFiles( this, transferId, messageInfo, callback );
};
FNetHostP2PClient.prototype.transferFiles = function( list, destinationPath, finalResponse, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.host.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.host.callback;
    FriendNetwork.doTransferFiles( this, list, destinationPath, finalResponse, messageInfo, callback );
};
FNetHostP2PClient.prototype.close = function()
{
    var self = this;
    var msg = {
        type: 'event',
        data: {
            command: 'hostDisconnected',
            hostKey: self.hostKey,
            key: self.key,
            name: self.host.name
        }
    };
    self.peer.send( msg );
};
FNetHostP2PClient.prototype.send = function( data )
{
    var self = this;
    var msg = {
        type: 'event',
        data: {
            command: 'message',
            hostKey: self.hostKey,
            key: self.key,
            name: self.host.name,
            data: data
        }
    };
    self.peer.send( msg );
};
FNetHostP2PClient.prototype.refuseFileTransfer = function( accept, data )
{
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'refuseFileTransfer'
    };
    this.send( message );
};
FNetHostP2PClient.prototype.acceptFileTransfer = function( accept, infos )
{
    // Encrypts the data with host public key
    if ( !infos )
        infos = '';
    var infosCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( JSON.stringify( infos ) ), self.distantPublicKey );
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'acceptFileTransfer',
        infos: infosCrypted,
        accept: accept,
        publicKey: Workspace.encryption.keys.client.publickey
    };
    this.send( message );
};

function FNetClient( key, messageInfo, hostId, hostKey, hostName, p2p, callback )
{
    console.log( 'FNetClient', key );
    var self = this;
    self.name = FriendNetwork.hostName;
    self.key = key;
    self.messageInfo = messageInfo;
    self.applicationId = messageInfo.applicationId;
    self.applicationName = messageInfo.applicationName;
    self.distantId = hostId;
    self.hostKey = hostKey;
    self.hostName = hostName;
    self.callback = callback;
    self.p2pEnabled = p2p;
    self.isClient = true;
    self.conn = null;
    self.events = [ ];
    self.events[ 'getCredentials' ] = getCredentials;
    self.events[ 'wrongCredentials' ] = wrongCredentials;
    self.events[ 'failedCredentials' ] = failedCredentials;
    self.events[ 'connected' ] = connected;
    self.events[ 'hostDisconnected' ] = hostDisconnected;
    self.events[ 'message' ] = message;
    self.events[ 'ping' ] = ping;
    self.timeoutCount = 10;
    self.fileTransfers = [];
    self.fileTransfersCount = 0;
    self.fileTransfersAccepted = 'none';
    self.fileTransfersOn = false;
    self.fileTransferInfos = false;

    // Using this as appConn for peer connection
    self.conn = new EventNode(
    self.key,
    FriendNetwork.conn,
    eventSink
    );

    // Redefine EventNode.send
    self.conn.send = sendToHost;
    function sendToHost( event )
    {
        var toApp = {
            type: self.hostKey,
            data: event,
        };
        console.log( 'sendToHost', toApp );
        FriendNetwork.conn.send( self.distantId, toApp );
    }
    function eventSink()
    {
        console.log( 'FNetClient - eventsink', arguments );
    }

    if ( ! self.p2pEnabled )
    {
        FriendNetwork.conn.on( key, handleEvents );
        self.conn.send(
        {
            command: 'connect',
            id: FriendNetwork.networkId,
            key: self.key,
            name: self.name,
            applicationName: self.applicationName
        } );
    }
    else
    {
        console.log( 'FNetClient.self', self );
        FriendNetwork.conn.connect(
        self.distantId,
        self.hostKey,
        { },
        self.key,
        connectBack
        );

        function connectBack( err, res )
        {
            console.log( 'FNetClient.connectBack', {
                e: err,
                r: res
            } );
            self.peer = new Peer(
            res,
            self.conn,
            peerEventSink,
            onPeerEnd
            );
            self.p2p = true;
            self.peer.on( 'event', handleEvents );

            function peerEventSink()
            {
                console.log( 'FNetClient peerEventsink', arguments );
            }
            function onPeerEnd( e )
            {
                console.log( 'FNetClient peer ended' );
            }
        }
    }

    function handleEvents( data )
    {
        console.log( 'FNetClient.handleEvents', data );
        if ( self.events[ data.command ] )
            self.events[ data.command ].apply( self, [ data ] );
        else
            console.log( 'FNetClient command not found', data );
    }
    function getCredentials( data )
    {
        self.distantKey = data.key;
        self.distantName = data.name;
        self.distantAppName = data.applicationName;
        self.hostPublicKey = data.publicKey;
        self.sessionPassword = data.sessionPassword;

        var nmsg = {
            key: self.key,
            name: self.distantName,
            hostName: self.hostName,
            sessionPassword: self.sessionPassword
        };
        FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'getCredentials', nmsg );
    }
    function wrongCredentials( data )
    {
        FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_WRONG_CREDENTIALS', self.key, self.distantName );
    }
    function failedCredentials( data )
    {
        FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_FAILED_CREDENTIALS', self.key, self.distantName );
        FriendNetwork.conn.release( self.key );
        FriendNetwork.sessions[ self.key ] = false;
        FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
    }
    function connected( data )
    {
        var nmsg = {
            key: self.key,
            hostName: self.hostName,
            name: self.distantName,
            sessionPassword: self.sessionPassword
        };
        FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'connected', nmsg );

        console.log( 'FNetClient.connected', data );
    }
    function hostDisconnected( data )
    {
        var nmsg = {
            hostKey: self.hostKey,
            key: self.key,
            name: self.hostName
        };
        FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'hostDisconnected', nmsg );
        FriendNetwork.conn.release( self.key );
        FriendNetwork.removeSession( self.key );
    }
    function ping( data )
    {
        var self = this;
        self.timeoutCount = 10;
        var msg =
        {
            command: 'pong',
            key: self.distantKey
        };
        self.conn.send( msg );
    }
    function message( data )
    {
        // A file transfer?
        if ( data.data.subCommand == 'fileTransfer' )
        {
            // Waiting for acceptation on the other side
            switch ( data.data.response )
            {
                case 'acceptFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'authoriseFileTransfer',
                        key: self.key,
                        transferId: data.data.transferId,
                        publicKey: data.data.publicKey,
                        infos: data.data.infos
                    };
                    FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'fileTransfer', message );
                    break;
                case 'demandFileTransfer':
                    // Sends message to window, application has to confirm
                    message = 
                    {
                        response: 'demandFileTransfer',
                        key: self.key,
                        publicKey: data.data.publicKey,
                        list: data.data.list,
                        infos: data.data.infos,
                        finalResponse: data.data.finalResponse
                    };
                    FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'fileTransfer', message );
                    break;
                default:
                    // Transmits to receive routine
                    FriendNetwork.doReceiveFiles( this, data.data, self.messageInfo, self.callback );
                    break;
            }
        }
        else
        {
            var nmsg = 
            {
                key: self.key,
                name: self.distantName,
                data: data.data
            };
            FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'messageFromHost', nmsg );
        }
    }
}
FNetClient.prototype.initFileTransfer = function( onOff, infos )
{
    if ( !infos )
        infos = '';
    self.fileTransfersInfos = infos;
    self.fileTransfersOn = onOff;
};
FNetClient.prototype.authoriseFileTransfer = function( response, transferId )
{
    self.fileTransfersAccepted = response;
};
FNetHostClient.prototype.demandFileTransfer = function( list, infos, finalReponse )
{
    if ( !list )
    {
        // I need list of files!
        FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'FriendNetwork error', self.key, 'Please provide a list of files.' );        
        return;
    }

    // Sends a message to other side
    if ( !infos )
        infos = '';
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'demandFileTransfer',
        infos: infos,
        list: list,
        publicKey: Workspace.encryption.keys.client.publickey,
        finalResponse: finalReponse
    };
    this.send( message );
};
FNetClient.prototype.closeFileTransfer = function( transferId, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.callback;
    FriendNetwork.doCloseFileTransfer( this, transferId, messageInfo, callback );
};
FNetClient.prototype.deleteTransferedFiles = function( transferId, messageInfo )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.callback;
    FriendNetwork.doDeleteTransferedFiles( this, transferId, messageInfo, callback );
};
FNetClient.prototype.transferFiles = function( list, destinationPath, finalResponse, messageInfo, callback )
{
    if ( typeof messageInfo == 'undefined' )
        messageInfo = this.messageInfo;
    if ( typeof callback == 'undefined' )
        callback = this.callback;
    FriendNetwork.doTransferFiles( this, list, destinationPath, finalResponse, messageInfo, callback );
};
FNetClient.prototype.refuseFileTransfer = function( accept, data )
{
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'refuseFileTransfer'
    };
    this.send( message );
};
FNetClient.prototype.acceptFileTransfer = function( accept, infos )
{
    // Encrypts the data with host public key
    if ( !infos )
        infos = '';
    var infosCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( JSON.stringify( infos ) ), self.distantPublicKey );
    var message =
    {
        command: 'friendnetwork',
        subCommand: 'fileTransfer',
        response: 'acceptFileTransfer',
        infos: infosCrypted,
        accept: accept,
        publicKey: Workspace.encryption.keys.client.publickey
    };
    this.send( message );
};
FNetClient.prototype.send = function( data )
{
    var self = this;
    if ( ! self.p2p )
    {
        var msg =
        {
            command: 'message',
            key: self.distantKey,
            name: self.localName,
            data: data
        };
        self.conn.send( msg );
    }
    else if ( self.peer )
    {
        var msg =
        {
            type: 'event',
            data:
            {
                command: 'message',
                key: self.distantKey,
                name: self.localName,
                data: data
            }
        };
        self.peer.send( msg );
    }
};
FNetClient.prototype.sendCredentials = function( password )
{
    var self = this;

    // Encrypts the password with host public key
    var passCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( password ), self.hostPublicKey );
    if ( ! self.p2p )
    {
        var msg =
        {
            command: 'credentials',
            key: self.distantKey,
            name: self.name,
            data: passCrypted
        };
        self.conn.send( msg );
    }
    else if ( self.peer )
    {
        var msg =
        {
            type: 'event',
            data:
            {
                command: 'credentials',
                key: self.distantKey,
                name: self.name,
                data: passCrypted
            }
        };
        self.peer.send( msg );
    }
};
FNetClient.prototype.close = function()
{
    var self = this;
    if ( ! self.p2p )
    {
        self.conn.send(
        {
            command: 'clientDisconnected',
            key: self.distantKey,
            name: self.name
        } );
    }
    else if ( self.peer )
    {
        var msg =
        {
            type: 'event',
            data:
            {
                command: 'clientDisconnected',
                key: self.distantKey,
                name: self.name
            }
        };
        self.peer.send( msg );
    }

    // Send message to view
    var msg = {
        key: self.key,
        name: self.distantName
    };
    FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'disconnected', msg );

    FriendNetwork.conn.release( self.key );
    FriendNetwork.sessions[ self.key ] = false;
};
