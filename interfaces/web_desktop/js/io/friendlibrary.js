/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Simple abstraction for FriendUP modules
var FriendLibrary = function ( library, encryption )
{
	// Get cleaned library
	this.encryption = encryption ? true : false;
	this.library = library.split( '.library' ).join ( '' ).toLowerCase();
	this.args = false;
	this.method = false;
	this.vars = [];
	
	this.addVar = function( k, value )
	{
		this.vars[k] = value;
	}
	
	this.destroy = function()
	{
		this.encryption = null;
		this.library = null;
		this.args = null;
		this.method = null;
		this.vars = null;
		if( this.currentRequest )
		{
			this.currentRequest.destroy();
			this.currentRequest = null;
		}
		delete this;
	}

	// Execute a method to a Friend UP module
	this.execute = function( method, args )
	{
		if ( method )  this.method = method;
		
		var data = '';
		
		var j = new cAjax ();	
		if( this.cancelId )
			j.cancelId = this.cancelId;
		if( this.onQueue )
			j.onQueue = this.onQueue;
		
		this.currentRequest = j;	
		
		if( this.forceHTTP )
			j.forceHTTP = true;
		if( this.forceSend )
			j.forceSend = true;
		if( this.loginCall )
		    j.loginCall = true;
		
		var ex = '';
		
		if( args )
		{
			this.args = args;
			if( typeof( args ) == 'string' )
			{
				ex += '/' + args;
			}
			else if( typeof( args ) == 'object' )
			{
				for( var a in args )
				{
					if( a == 'command' )
					{
						ex += '/' + args[a];
					}
					else 
					{
						if( typeof( args[a] ) == 'object' )
						{
							this.addVar( a, JSON.stringify( args[a] ) );
						}
						else this.addVar( a, args[a] );
					}
				}
			}
		}
		
		j.open ( 'post', '/' + this.library + '.library/' + this.method + ex, true, true );
		
		if( typeof( Workspace ) != 'undefined' && Workspace.sessionId )
		{
			this.addVar( 'sessionid', Workspace.sessionId );
		}
		
		if( this.encryption )
		{
			// If ssl is enabled add vars encrypted data string to send as post raw data with cAjax
			if( this.vars && typeof( fcrypt ) != 'undefined' && typeof( Workspace ) != 'undefined' && Workspace.encryption.keys.server && Workspace.encryption.keys.client )
			{
				var json = JSON.stringify( this.vars );
				
				if( json )
				{
					// TODO: This will probably not work in C code only made for js/php since encryptString is a RSA+AES combination to support large blocks of data outside of RSA limitations, make encryptRSA() support stacking of blocks split by block limit
					//var encrypted = fcrypt.encryptString( json, Workspace.keys.server.publickey );
					
					//if( encrypted && encrypted.cipher )
					//{
					//	data = encrypted.cipher;
					//}
					
					//data = fcrypt.encryptRSA( json, Workspace.keys.server.publickey );
					var encrypted = fcrypt.encryptRSA( json, Workspace.encryption.keys.server.publickey );
					
					j.addVar( 'encryptedblob', encrypted );
					
					console.log( 'data', { vars: this.vars, data: ( data ? data : encrypted ) } );
				}
			}
		}
		else
		{
			// Add vars
			for( var a in this.vars )
			{
				j.addVar( a, this.vars[a] );
			}
		}
		
		if( this.onExecuted )
		{
			var t = this;
			j.onload = function( rc, d )
			{
				// First try to parse a pure JSON string
				try
				{
					
					if( t.encryption )
					{
						// If ssl is enabled decrypt the data returned by cAjax
						if( rc && typeof( fcrypt ) != 'undefined' && typeof( Workspace ) != 'undefined' && Workspace.encryption.keys.server && Workspace.encryption.keys.client )
						{
							// TODO: This will probably not work in C code only made for js/php since decryptString is a RSA+AES combination to support large blocks of data outside of RSA limitations, make decryptRSA() support stacking of blocks split by block limit
							//var decrypted = fcrypt.decryptString( rc, Workspace.keys.client.privatekey );
							
							//if( decrypted && decrypted.plaintext )
							//{
							//	rc = decrypted.plaintext;
							//}
							
							rc = fcrypt.decryptRSA( rc, Workspace.encryption.keys.client.privatekey );
						}
					}
					
					var json = JSON.parse( rc );
					if( json )
					{
						return t.onExecuted( json );
					}
					// No json then..
					t.onExecuted( rc, d );
					t.destroy();
				}
				// No, it's not that
				catch( e )
				{
					// Used for localization of responses etc
					if( d && d.length && t.replacements )
					{
						for( var z in t.replacements )
						{
							d = d.split ( '{'+z+'}' ).join ( t.replacements[z] );
						}
					}
					t.onExecuted( rc, d );
					t.destroy();
				}
			}
		}
		
		j.send ( data );
	}
}

// Eventually move to new Library()
var Library = FriendLibrary;


