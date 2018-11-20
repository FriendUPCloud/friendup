/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/



// Simple abstraction for FriendUP crypto authentication
Authenticate = {
	
	crypt    : {},
	
	path     : false,
	
	uniqueId : false,
	username : false,
	password : false,
	
	seed     : false,
	keys     : false,
	
	
	
	methodMap : {
		'load' : function( msg, app )
		{
			Authenticate.getItem( msg, app )
		},
		'uniqueid' : function( msg, app )
		{
			Authenticate.getUniqueId( msg, app );
		},
		'encryptkey' : function( msg, app )
		{
			Authenticate.encryptKey( msg, app );
		},
		'decryptkey' : function( msg, app )
		{
			Authenticate.decryptKey( msg, app );
		},
		'encrypt' : function( msg, app )
		{
			Authenticate.encrypt( msg, app );
		},
		'decrypt' : function( msg, app )
		{
			Authenticate.decrypt( msg, app );
		}
	},
	
	// TODO: Clean up this mess as we finish features and get it to work .... mess is because of time pressure!!! ...
	
	// TODO: Add uniqueId and MD5 Hashed Password from somewhere, if not keys will be random
	
	// TODO: Recover privatekey from a sha256 recoverykey
	
	// TODO: Has to be tested and corrected before it will work.
	
	// TODO: Don't run init without checking for uniqueId first if required get it first
	
	init : function( conf )
	{
		this.setup( conf );
		
		if( !this.seed && !this.uniqueId && this.username )
		{
			this.getUniqueId();
			// TODO: Add some callback thing for getKeys() based on success or failed
			return this.getKeys();
		}
		else
		{
			return this.getKeys();
		}
	},
	
	setup : function( conf )
	{
		this.path = conf.path || false;
		
		this.uniqueId = conf.uniqueId || false;
		this.username = conf.username || false;
		this.password = conf.password || false;
		
		this.seed = conf.seed || false
		
		this.keys = conf.keys || false;
	},
	
	receiveMsg : function( msg, app )
	{
		var handler = this.methodMap[ msg.method ];
		if ( !handler )
		{
			msg.data.success = false;
			msg.data.message = 'no such handler';
			this.send( msg, app );
			return;
		}
		
		var success = this.checkId( msg );
		if ( !success ) return;
		
		handler( msg, app );
	},
	
	setItem : function( msg, app )
	{
		var bundle = msg.data;
		var appData = this.load( app );
		if( bundle.id )
		{
			appData[ bundle.id ] = bundle.data;
		}
		var success = this.save( appData, app );
		bundle.success = success;
		this.send( msg, app );
	},
	
	getItem : function( msg, app )
	{
		var bundle = msg.data;
		var appData = this.load( app );
		var data = ( bundle.id ? appData[ bundle.id ] : appData );
		bundle.data = data;
		this.send( msg, app );
	},
	
	removeItem : function( msg, app )
	{
		var bundle = msg.data;
		var id = bundle.id;
		var appData = ( id ? this.load( app ) : '' );
		if( id )
		{
			delete appData[ id ];
		}
		var success = this.save( appData, app );
		bundle.success = success;
		this.send( msg, app );
	},
	
	send : function( msg, app )
	{
		msg.command = 'authenticate';
		app.contentWindow.postMessage( msg, '*' );
	},
	
	load : function( app )
	{
		//console.log( 'Workspace.userId: ', Workspace.userId );
		//console.log( 'app.applicationName: ', app.applicationName );
		//console.log( 'app.userId: ', app.userId );
		
		var authorized = ( Workspace.userId == app.userId ? true : false );
		var appData = ( authorized ? window.localStorage.getItem( 'Workspace' ) : false );
		appData = friendUP.tool.parse( appData );
		if ( !appData ) appData = {};
		return appData;
	},
	
	save : function( appData, app )
	{
		var authorized = ( Workspace.userId == app.userId ? true : false );
		appData = ( authorized ? friendUP.tool.stringify( appData ) : false );
		if ( !appData ) return false;
		window.localStorage.setItem( 'Workspace', appData );
		return true;
	},
	
	checkId : function( msg )
	{
		var bundle = msg.data;
		if ( !bundle.id )
		{
			return true;
		}
		
		var cleanId = bundle.id.toString().trim();
		if ( cleanId !== bundle.id )
		{
			returnError();
			return false;
		}
		
		return true;
		
		function returnError()
		{
			console.log( 'authenticate - invalid msg', msg );
			bundle.success = false;
			bundle.message = 'invalid id';
			bundle.cleanId = cleanId || null;
			this.send( msg, app );
		}
	},
	
	
	
	encryptKey : function( msg, app )
	{
		//console.log( 'msg encryptKey: ', msg );
		
		var bundle = msg.data;
		
		this.crypt = fcrypt.generateKeys( msg.data.str );
		//this.crypt = fcrypt.generateKeys();
		
		this.keys = fcrypt.getKeys( this.crypt, true );
		
		//console.log( 'this.keys: ', this.keys );
		
		var storagekeys = this.load( app )
		
		//console.log( 'storagekeys: ', storagekeys );
		
		if( storagekeys && storagekeys.publickey )
		{
			var encryptedKey = this.encrypt( this.keys.privatekey, storagekeys.publickey );
			
			//console.log( 'encryptedkey: ', encryptedKey );
			
			bundle.data = { publickey : storagekeys.publickey, encrypted : encryptedKey };
		}
		else
		{
			bundle.data = false;
		}
		
		if( msg.callbackId && app )
		{
			this.send( msg, app );
			
			return true;
		}
		
		return ( bundle.data ? bundle.data : false );
	},
	
	
	
	
	
	
	getKeys : function( cleanKeys, conf )
	{
		if( conf )
		{
			this.setup( conf );
		}
		
		if( this.keys.privatekey )
		{
			this.crypt = fcrypt.setPrivateKeyRSA( this.keys.privatekey );
		}
		else
		{
			var seed = this.seed || '';
			
			if( !seed && this.uniqueId && this.password )
			{
				// TODO: Add MD5 check for password, it has to be MD5hashed
				seed = this.uniqueId + ':' + this.password;
			}
			
			this.crypt = fcrypt.generateKeys( seed );
		}
		
		this.keys = fcrypt.getKeys( this.crypt, cleanKeys );
		
		if( this.keys )
		{
			this.keys.privatekey = this.base64_encode( this.keys.privatekey );
			this.keys.publickey  = this.base64_encode( this.keys.publickey );
			
			if( this.keys.recoverykey )
			{
				this.keys.recoverykey = this.base64_encode( this.keys.recoverykey );
			}
		}
		
		return this.keys;
	},
	
	getPrivateKey : function()
	{
		var privateKey = this.crypt.getPrivateKey();
		
		if( privateKey )
		{
			return privateKey;
		}
		
		return false;
	},
	
	getPublicKey : function()
	{
		var publicKey = this.crypt.getPublicKey();
		
		if( publicKey )
		{
			return publicKey;
		}
		
		return false;
	},
	
	setRecoveryKey : function( key )
	{
		// TODO: This has to be set before key generation starts
		// Perhaps add to this.seed
		this.crypt = fcrypt.setKey( key );
	},
	
	getRecoveryKey : function()
	{
		var key = this.crypt.getKey();
		
		if( key )
		{
			return key;
		}
		
		return false;
	},
	
	encrypt : function( message, publicKey )
	{
		//console.log( '--- fcrypt.encryptString --- : ' + message + ' [] ' + publicKey );
		var encrypted  = fcrypt.encryptString( message, publicKey );
		var ciphertext = encrypted.cipher;
		
		if( ciphertext )
		{
			return ciphertext;
		}
		
		return false;
	},
	
	decrypt : function( ciphertext, privateKey )
	{
		var decrypted = fcrypt.decryptString( ciphertext, privateKey );
		var plaintext = decrypted.plaintext;
		
		if( plaintext )
		{
			return plaintext;
		}
		
		return false;
	},
	
	sign : function( message, privateKey )
	{
		var signature = this.crypt.signString( message, privateKey );
		
		if( signature )
		{
			return signature;
		}
		
		return false;
	},
	
	verify : function( message, signature, publicKey )
	{
		var valid = this.crypt.verifyString( message, signature, publicKey );
		
		if( valid )
		{
			return valid;
		}
		
		return false;
	},
	
	signCertificate : function( data, publicKey, privateKey )
	{
		var signed      = this.crypt.signCertificate( data, publicKey, privateKey );
		var certificate = signed.certificate;
		var signature   = signed.signature;
		
		if( signed )
		{
			return signed;
		}
		
		return false;
	},
	
	verifyCertificate : function( certificate, privateKey, signed )
	{
		var valid = this.crypt.verifyCertificate( certificate, privateKey, signed );
		
		if( valid )
		{
			return valid;
		}
		
		return false;
	},
	
	recoverAccount : function( recoveryKey )
	{
		// Add callback
		
		// TODO: Add this more dynamic for other purposes then Treeroot
		
		if( recoveryKey )
		{
			var token = this.getToken( recoveryKey );
			
			if( token )
			{
				return token;
			}
		}
		
		return false;
	},
	
	getUniqueId : function( msg, app )
	{
		// Add callback
		
		// TODO: Add this more dynamic for other purposes then Treeroot
		
		//console.log( 'msg: ', msg );
		
		var self = this;
		
		var bundle    = ( msg ? msg.data : {} );
		
		this.path     = ( bundle.path ? bundle.path : this.path );
		this.username = ( bundle.username ? bundle.username : this.username );
		
		if( this.path && this.username )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( 'reqBack', { e : e, d : d });
				
				if( e == 'ok' )
				{
					d = JSON.parse( d );
					
					console.log( d );
					
					if( d.uniqueid )
					{
						self.uniqueId = d.uniqueid;
						
						bundle.data = self.uniqueId;
					}
					else
					{
						// Add error messages
					}
				}
				else
				{
					// Add error messages
				}
				
				if( msg && msg.callbackId && app )
				{
					self.send( msg, app );
				}
			}
			m.execute( 'proxyget', {
				url : this.path,
				Username : this.username,
				Source : 'FriendUP',
				Encoding : 'json'
			} );
		}
	},
	
	getToken : function( recoveryKey )
	{
		// Add callback
		
		// TODO: Add this more dynamic for other purposes then Treeroot
		
		if( this.path && this.uniqueId && this.keys.publickey )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( 'reqBack', { e : e, d : d });
				
				if( e == 'ok' )
				{
					d = JSON.parse( d );
					
					console.log( d );
					
					if( d.password )
					{
						var message = this.crypt.decryptRSA( d.password );
						var signature = this.crypt.signString( message );
						
						var mm = new Module( 'system' );
						mm.onExecuted = function( ee, de )
						{
							console.log( 'reqBack', { ee : ee, dd : dd });
							
							if( ee == 'ok' )
							{
								dd = JSON.parse( dd );
								
								console.log( dd );
								
								if( dd.sessionid )
								{
									this.token = dd.sessionid;
								}
								else
								{
									// Add error messages
								}
							}
							else
							{
								// Add error messages
							}
						}
						mm.execute( 'proxyget', {
							url : this.path,
							UniqueID : this.uniqueId,
							Signature : signature,
							Source : 'FriendUP',
							Encoding : 'json'
						} );
					}
					else
					{
						// Add error messages
					}
				}
				else
				{
					// Add error messages
				}
			}
			
			var args = {
				url : this.path,
				UniqueID : this.uniqueId,
				PublicKey : this.keys.publickey,
				Source : 'FriendUP',
				Encoding : 'json'
			}
			
			if( recoveryKey )
			{
				args['RecoveryKey'] = recoveryKey;
			}
			
			m.execute( 'proxyget', args );
		}
	},
	
	base64_encode : function( str )
	{
		var b64 = false;	
		
		if( str )
		{
			try 
			{
				b64 = btoa( str );
			}
			catch( e ) 
			{
				return str;
			}
		}
		
		return b64;
	},
	
	base64_decode : function( str )
	{
		var b64 = false;	
		
		if( str )
		{
			try 
			{
				b64 = atob( str );
			}
			catch( e ) 
			{
				return str;
			}
		}
		
		return b64;
	}
};


// TODO: Add Namespacing if needed


