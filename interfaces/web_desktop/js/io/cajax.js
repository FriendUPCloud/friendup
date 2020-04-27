/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var _cajax_process_count = 0;

var _cajax_connection_seed = Math.random(0,999)+Math.random(0,999)+Math.random(0,999) + '_';
var _cajax_connection_num = 0;

var _cajax_http_connections = 0;                // How many?
var _cajax_http_max_connections = 6;            // Max
var _cajax_http_last_time = 0;                  // Time since last
var _cajax_mutex = 0;

// For debug
var _c_count = 0;
var _c_destroyed = 0;

if( !window.Friend ) window.Friend = {};
if( !Friend.cajax ) Friend.cajax = [];

function AddToCajaxQueue( ele )
{
	// If we're queueing it
	if( ele.onQueue ) ele.onQueue();
	
	// Queued objects get eternal life
	if( ele.life )
	{
		clearTimeout( ele.life );
		ele.life = null;
	}
	
	ele.queued = true;
	
	// Don't add to queue if we are offline
	if( !Workspace.serverIsThere || Workspace.workspaceIsDisconnected )
	{
		if( ele.onload )
		{
			ele.onload( null, null );
		}
		return ele.destroy();
	}
	
	// TODO: Support a nice queue.. :-)
	if( !window.Friend || !window.Friend.cajax )
	{
		return false;
	}
	// Duplicate check
	for( var a = 0; a < Friend.cajax.length; a++ )
	{
		if( Friend.cajax[a] == ele )
		{
			return false;
		}
	}
	// Add ajax element to the top of the queue
	var o = [ ele ];
	for( var a = 0; a < Friend.cajax.length; a++ )
		o.push( Friend.cajax[ a ] );
	Friend.cajax = o;
}

function RemoveFromCajaxQueue( ele )
{
	var o = [];
	var executeLength = 6;
	var executors = [];
	for( var a = 0; a < Friend.cajax.length; a++ )
	{
		if( Friend.cajax[a] != ele )
		{
			if( executeLength > 0 )
			{
				executors.push( Friend.cajax[a] );
				executeLength--;
			}
			else
			{
				o.push( Friend.cajax[a] );
			}
		}
	}
	Friend.cajax = o;
	for( var a = 0; a < executors.length; a++ )
	{
		executors[ a ].send( null );
	}
}

// Cancel all queued cajax calls on id
function CancelCajaxOnId( id )
{
	var o = [];
	for( var a = 0; a < Friend.cajax.length; a++ )
	{
		if( Friend.cajax[ a ].cancelId != id )
			o.push( Friend.cajax[ a ] );
		else 
		{
			// Tell it it failed
			Friend.cajax[ a ].destroy();
		}
	}
	Friend.cajax = o;
}

// A simple ajax function
// Can have a cancellable series
cAjax = function()
{
	var self = this;
	
	_cajax_process_count++;
	
	// cajax only survives for so long..
	self.life = setTimeout( function()
	{
		self.destroy();
	}, 5000 );
	
	// Vars to mark success / process count
	this.decreasedProcessCount = false;
	
	// Other
	this.openFunc = null;
	this.opened = false;
	this.context = false; // Named contexts, so that we can kill an entire context
	
	this.setResponseType = function( type )
	{
		switch( type )
		{
			case 'arraybuffer':
				this.proxy.responseType = 'arraybuffer';
				break;
			case 'blob':
				this.proxy.responseType = 'blob';
				break;
			default:
				this.proxy.responseType = '';
				break;
		}
	};
	
	this.vars = [];
	this.mode = 'ajax';
	this.varcount = 0;

	// TODO: Enable for later	
	//this.worker = new Worker( '/webclient/js/io/cajax_worker.js' );
	
	// Get correct AJAX base object
	if ( typeof( ActiveXObject ) != 'undefined' )
		this.proxy = new ActiveXObject( 'Microsoft.XMLHTTP' );
	else this.proxy = new XMLHttpRequest();
	
	// State call
	var jax = this;
	this.proxy.onreadystatechange = function()
	{
		// We're finished handshaking
		if( this.readyState == 4 && this.status == 200  )
		{	
			if( this.responseType == 'arraybuffer' )
			{
				jax.rawData = this.response;
			}
			else if( this.responseType == 'blob' )
			{
				jax.rawData = new Blob( [ this.response ] );
			}
			else
			{
				jax.rawData = this.responseText;
			}
			
			if( this.responseType != '' )
			{
				jax.returnData = jax.rawData;
				jax.returnCode = 'ok';
			}
			else if( this.hasReturnCode )
			{
				var sep = '<!--separate-->';
				if( this.responseText.indexOf( sep ) > 0)
				{
					jax.returnCode = this.responseText.substr( 0, this.responseText.indexOf( sep ) );
					jax.returnData = this.responseText.substr( this.responseText.indexOf( sep ) + sep.length );
				}
				else
				{
					jax.returnData = false;
					jax.returnCode = this.responseText;
				}
			}
			else
			{
				jax.returnCode = false;
				jax.returnData = this.responseText;
			}
			
			// TODO: This error is general
			if( this.responseType != 'arraybuffer' && this.responseType != 'blob' )
			{
				if( JSON && jax.rawData.charAt( 0 ) == '{' )
				{
					try
					{
						var t = JSON.parse( jax.rawData );
						// Deprecate from 1.0 beta 2 "no user!"
						var res = t ? t.response.toLowerCase() : '';
						if( t && ( res == 'user not found' || res.toLowerCase() == 'user session not found' ) )
						{
							if( window.Workspace && res.toLowerCase() == 'user session not found' ) 
								Workspace.flushSession();
							if( window.Workspace )
							{
								// Drop these (don't retry!) because of remote fs disconnect
								if( jax.url.indexOf( 'file/info' ) > 0 )
								{
									return jax.destroy();
								}
								
								// Add to queue
								AddToCajaxQueue( jax );
								return Workspace.relogin();
							}
						}
					}
					catch( e )
					{
						if( !jax.rawData )
						{
							//console.log( '[cAjax] Can not understand server response: ', jax.rawData );
							jax.destroy();
							return;
						}
					}
				}
				// Respond to old expired sessions!
				else if( jax.returnCode == 'fail' )
				{
					try
					{
						var r = JSON.parse( jax.returnData );
						
						var res = r ? r.response.toLowerCase() : '';
						
						if( res == 'user not found' || res.toLowerCase() == 'user session not found' )
						{
							if( window.Workspace && res.toLowerCase() == 'user session not found' ) 
								Workspace.flushSession();
							
							if( window.Workspace && Workspace.postInitialized && Workspace.sessionId )
							{
								// Add to queue
								AddToCajaxQueue( jax );
								return Workspace.relogin();
							}
						}
					}
					catch( e )
					{
					}
				}
			}
			else
			{
				if( jax.rawData )
				{
					this.returnCode = 'ok';
					this.returnData = this.rawData;
				}
				else
				{
					this.returnCode = 'false';
					this.returnData = null;
				}
			}
			
			// Clean up
			if( jax.mode != 'websocket' )
			{
				if( !jax.forceSend )
					_cajax_http_connections--;
				//console.log( '[cajax] We now are running ' + _cajax_http_connections + '/' + _cajax_http_max_connections + ' connections. (closed one)', Friend.cajax );
			}
			
			// End clean queue

			// Execute onload action with appropriate data
			if( jax.onload )
			{
				jax.onload( jax.returnCode, jax.returnData );
			}
			jax.destroy();
		}
		// Something went wrong!
		else if( this.readyState == 4 && ( this.status == 500 || this.status == 0 || this.status == 404 ) )
		{
			// tell our caller...
			if( jax.onload ) 
			{
				jax.onload( 'error', false );
			}
			jax.destroy();
		}
		else
		{
			//console.log( '* Idling ajax: ' + this.readyState + ' ' + this.status );
		}
	}
}

// Clean up object
// Never use this one outside the destroy() function!!!
cAjax.prototype.destroySilent = function()
{
	var self = this;
	
	// No more activity here!
	self.decreaseProcessCount();
	
	if( self.opened )
		self.close();

	if( self.life ) clearTimeout( self.life );
	self.life = null;

	self.vars = null;
	self.mode = null;
	self.url = null;
	self.hasReturnCode = null;
	self.lastOptions = null;
	self.proxy = null;
	if( self.worker )
		self.worker.terminate();
	self.worker = null;
	self.data = null;
	self.rawData = null;
	self.varcount = null;
	self.wsRequestID = null;
	self.wsData = null;
	self.connectionId = null;
	self.hasReturnCode = null;
	self.returnCode = null;
	self.returnData = null;
	self.method = null;
	self.onload = null;
	self.openFunc = null;
	
	
	// finally
	delete this;
}
cAjax.prototype.destroy = function()
{
	this.destroy = function(){};
	
	// Terminate with onload
	if( this.onload )
	{
		//console.log( 'Should never happen.' );
		this.onload( null, null );
	}

	// Clean out possible queue and replenish
	RemoveFromCajaxQueue( this )
	
	// Clean up
	this.destroySilent();
}

// Open an ajax query
cAjax.prototype.open = function( method, url, syncing, hasReturnCode )
{
	var self = this;
	
	if( this.opened )
	{
		//console.log( '[cajax] Impossible error! Illegal reuse of object.' );
		this.destroy();
		return;
	}
	this.opened = true;
	
	// Try websockets!!
	if( 
		!this.forceHTTP &&
		this.proxy.responseType != 'arraybuffer' &&
		window.Workspace &&
		Workspace.conn && 
		Workspace.conn.ws && 
		!Workspace.websocketsOffline && 
		Workspace.websocketState == 'open' &&
		typeof( url ) == 'string' && 
		url.indexOf( 'system.library' ) >= 0 &&
		url.indexOf( 'http' ) != 0 &&
		url.indexOf( '/file/read' ) < 0 &&
		url.indexOf( '/file/write' ) < 0
	)
	{
		this.mode = 'websocket';
		this.url = url;
		this.hasReturnCode = hasReturnCode;
		return true;
	}
	
	// If we are running this on friendup recreate url to support old method
	if ( typeof AjaxUrl == 'function' )
	{
		url = AjaxUrl( url );
	}
	
	if( this.lastOptions && !method && !url && !syncing && !hasReturnCode )
	{
		this.proxy.hasReturnCode = this.lastOptions.hasReturnCode;
		this.openFunc = function(){ 
			//console.log( '[cajax] Last options opening: ' + self.lastOptions.url );
			if( window.Workspace )
				self.addVar( 'sessionid', Workspace.sessionId );
			self.proxy.open( self.lastOptions.method, self.lastOptions.url, self.lastOptions.syncing ); 
		};
	}
	else
	{
		this.lastOptions = {
			method: method,
			url: url,
			syncing: syncing,
			hasReturnCode: hasReturnCode
		};
	
		if( !method ) method = this.method ? this.method : 'POST';
		else method = method.toUpperCase();
		if( !syncing ) syncing = true;
		if( !hasReturnCode ) hasReturnCode = false;
		this.method = method.toUpperCase();
		if( !url ) url = this.url;
		this.url = url;
		this.proxy.hasReturnCode = hasReturnCode;
		this.openFunc = function(){ 
			if( window.Workspace )
				self.addVar( 'sessionid', Workspace.sessionId );
			var u = self.url;
			if( u.substr( 0, 1 ) == '/' )
			{
				var urlbase = document.location.origin;
				u = urlbase + u;
			}
			self.proxy.open( self.method, u, syncing ); 
		};
	}
}

// Close it!
cAjax.prototype.close = function()
{
	if( this.opened )
	{
		// Abort connection
		this.proxy.abort();
		this.opened = false;
	}
}

// Add a variable to ajax query
cAjax.prototype.addVar = function( key, val )
{
	if( typeof( val ) == 'undefined' )
	{
		//// console.log( 'Test3: Trying to add undefined var.', key, val );
		return;
	}
	if( typeof( this.vars[ key ] ) == 'undefined' )
		this.varcount++;
	this.vars[ key ] = encodeURIComponent( val );
	return true;
}

// Set a request header
cAjax.prototype.setRequestHeader = function( type, data )
{
	return this.proxy.setRequestHeader( type, data );
}

// Just generate a random unique number
cAjax.prototype.getRandNumbers = function()
{
	var i = '';
	for( var a = 0; a < 2; a++ )
		i += Math.floor( Math.random() * 1000 ) + '';
	i += ( new Date() ).getTime();
	return i;
}

cAjax.prototype.responseText = function()
{
	return this.wsData ? this.wsData : this.proxy.responseText;
}

// Send ajax query
cAjax.prototype.send = function( data, callback )
{
	// Make sure we don't f this up!
	if( this.onload && !this.onloadAfter )
	{
		this.onloadAfter = this.onload;
		this.onload = function( e, d )
		{
			this.onload = null;
			this.onloadAfter( e, d );
			this.onloadAfter = null;
		}
	}

	var self = this;
	
	if( self.life )
	{
		clearTimeout( self.life );
		self.life = false;
	}
	
	if( self.queued )
	{
		self.queued = false;
		//console.log( '[cajax] This is running from queue.' );
	}
	
	if( !data && this.cachedData )
	{
		data = this.cachedData;
		this.cachedData = null;
	}
	
	// Keep for later
	if( data )
		this.cachedData = data;

	// Wait in case of relogin
	if( window.Workspace && Workspace.reloginInProgress && !this.forceSend )
	{
		AddToCajaxQueue( self );
		return;
	}
	
	// Can't have too many! Queue control
	if( this.mode != 'websocket' )
	{
		if( !this.forceSend && _cajax_http_connections >= _cajax_http_max_connections )
		{
			AddToCajaxQueue( self );
			return;
		}
		//console.log( '[cajax] We now are running ' + _cajax_http_connections + '/' + _cajax_http_max_connections + ' connections. (added one)' );
		if( !this.forceSend )
			_cajax_http_connections++;
	}
	
	// Register successful send
	_cajax_http_last_time = ( new Date() ).getTime();
	
	if( this.mode == 'websocket' && this.proxy.responseType == 'arraybuffer' )
	{
		this.mode = '';
	}
	
	// Only if successful
	function successfulSend( addBusy )
	{
		if( !addBusy ) return;
		
		// Update process count and set loading
		if( ge( 'Screens' ) )
		{
			if( _cajax_process_count > 0 )
			{
				var titleBars = document.getElementsByClassName( 'TitleBar' );
				for( var b = 0; b < titleBars.length; b++ )
				{
					if( !titleBars[b].classList.contains( 'Busy' ) )
						titleBars[b].classList.add( 'Busy' );
				}
				if( !document.body.classList.contains( 'Busy' ) )
					document.body.classList.add( 'Busy' );
			}
		}
	}

	// Check if we can use websockets
	if( self.mode == 'websocket' && window.Workspace && Workspace.conn && Workspace.conn.ws && Workspace.websocketState == 'open' )
	{
		//console.log( '[cajax] Sending ajax call with websockets.' );
        var u = self.url.split( '?' );
        var wsdata = ( data ? data : {} );
        if( self.vars )
        {
	       for (dataIndex in self.vars)
	       {
		       wsdata[ dataIndex ] = self.vars[ dataIndex ];
	       }
        }

	    // if we have parameters set in the URL we add them to the socket...
        if( u[1] )
        {
			var pairs = u[1].split( '&' );
			for( var a = 0; a < pairs.length; a++ )
			{
				var p = pairs[a].split( '=' );
				wsdata[p[0]] = p[1];
			}
        }
        
        var req = {
                path : u[0].substr(1),
                data : wsdata
        };
        
        var reqID = Workspace.conn.request( req, bindSingleParameterMethod( self, 'handleWebSocketResponse' ) );
        
        if( typeof( reqID ) != 'undefined' && !reqID )
        {
        	AddToCajaxQueue( self );
			return Workspace.relogin();
        }
        else if( typeof( reqID ) == 'undefined' )
        {
        	//console.log( 'cAjax: Request was undefined.' );
        }
        else
        {
        	// console.log( 'Test3: We got requestID: ' + reqID );
        }
        
        self.wsRequestID = reqID;
		
		// Not for module calls
		var addBusy = true;
		if( self.url.indexOf( 'module/' ) < 0 ) 
		{
			addBusy = false;
		}
		successfulSend( addBusy );
		return;
	}

	// standard HTTP way....
	if( this.openFunc )
	{
		this.openFunc();
	
		var res = null;
		
		if( this.method == 'POST' )
		{
			var u = this.url.split( '?' );
			u = u[0] + '?' + ( u[1] ? ( u[1]+'&' ) : '' ) + 'cachekiller=' + this.getRandNumbers();
			this.proxy.setRequestHeader( 'Method', 'POST ' + u + ' HTTP/1.1' );
			this.proxy.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
			
			// Send data
			if( data ) 
			{
				try
				{
					res = this.proxy.send( data );
				}
				catch( err )
				{
					if( self.onload )
					{
						self.onload( false, false );
						self.destroy();
					}
				}
			}
			else if( this.varcount > 0 )
			{
				var out = [];
				for( var a in this.vars )
					out.push( a + '=' + this.vars[a] );
				
				new Promise( function( resolve, reject )
				{
					try
					{
						res = self.proxy.send( out.join ( '&' ) );
						resolve( 'success' );
					}
					catch( err )
					{
						reject( 'error' );
						if( self.onload )
						{
							self.onload( false, false );
							self.destroy();
						}
						if( window.Workspace && Workspace.checkServerConnectionResponse )
							Workspace.checkServerConnectionResponse();
					}
				} ).catch( function( err )
				{
					console.log( 'Caught an error.', err );
					if( err == 'error' )
					{
						if( callback )
							callback( false, false );
					}
					else if( err == 'success' );
					{
						successfulSend();
					}
				} );
				// // console.log( 'Test2: Here u: ' + out.join( '&' ) );
			}
			// All else fails?
			else
			{
				try { res = this.proxy.send ( null ); }
				catch ( e ) { res = this.proxy.send( NULL ); }
			}
		
			//console.log( 'Posting ' + u );
		}
		// Normal GET request
		else
		{
			var u = this.url.split( '?' );
			u = u[0] + '?' + ( u[1] ? ( u[1]+'&' ) : '' ) + 'cachekiller=' + this.getRandNumbers();
			this.proxy.setRequestHeader( 'Method', 'GET ' + u + ' HTTP/1.1' );
			// // console.log( 'Test2: Here: ' + u );
			try 
			{ 
				res = this.proxy.send( null ); 
			}
			catch ( e ) 
			{ 
				res = this.proxy.send( NULL ); 
			}
		
			//console.log( 'Getting ' + u );
		}
		
		if( res )
		{
			successfulSend();
		}
		
		// New life
		if( self.life ) clearTimeout( self.life );
		self.life = setTimeout( function()
		{
			//console.log( 'Destroying self after ten seconds. ' + u );
			self.destroy();
		}, 10000 );
		
		//console.log( '[cajax] We sent stuff! ' + u );
		
		return;
	}
	else
	{
		//console.log( '[cajax] No openfunc!' );
	}
	// We were not successful!
	//console.log( '[cajax] Just destroying.' );
	this.destroy();
}

cAjax.prototype.decreaseProcessCount = function()
{
	if( this.decreasedProcessCount ) return;
	this.decreasedProcessCount = true;
	_cajax_process_count--;
	if( _cajax_process_count == 0 )
	{
		var titleBars = document.getElementsByClassName( 'TitleBar' );
		for( var b = 0; b < titleBars.length; b++ )
		{
			titleBars[b].classList.remove( 'Busy' );
		}
		document.body.classList.remove( 'Busy' );
	}
}

cAjax.prototype.handleWebSocketResponse = function( wsdata )
{	
	var self = this;
	
	if( self.life )
		clearTimeout( self.life );
	self.life = setTimeout( function()
	{
		//console.log( '[cajax] Defunct ajax object destroying self after five seconds. 2' );
		self.destroy();
		self.life = false;
	}, 5000 );
	
	// The data just failed - which means the websocket went away!
	if( typeof( wsdata ) == 'undefined' )
	{
		if( Workspace )
		{
			// Add to queue
			AddToCajaxQueue( self );
			return Workspace.relogin();
		}
		self.destroy();
		return;
	}
	
	if( typeof( wsdata ) == 'object' && wsdata.response )
	{
		self.rawData = 'error';
		if( self.proxy )
			self.proxy.responseText = self.rawData;
		//else console.log( 'No more proxy 1..', wsdata, self.onload );
		self.returnCode = 'error';
		self.destroy();
		return false;
	}
	
	if( self.proxy )
		self.proxy.responseText = wsdata;
	//else console.log( 'No more proxy..', wsdata, self.onload );
	self.rawData = wsdata;
	self.wsData = wsdata;
	
	if( self.rawData && typeof( self.rawData ) == 'string' && ( self == 'ok' || self == 'fail' || self.rawData.indexOf( '<!--separate-->' ) > 0 ) )
	{
		self.hasReturnCode = true;
	}
	else
	{
		self.hasReturnCode = false;
	}
	
	// Has return code, so separates return code and data
	if( self.hasReturnCode )
	{
		// With a separator
		var sep = '<!--separate-->';
		var sepaIndex = self.rawData.indexOf( sep );
		if( sepaIndex > 0 )
		{
			self.returnCode = self.rawData.substr( 0, sepaIndex );
			self.returnData = self.rawData.substr( sepaIndex + sep.length );
		}
		// No data
		else
		{
			self.returnCode = self.rawData;
			self.returnData = false;			
		}
	}
	// No return code and perhaps raw data
	else
	{
		self.returnCode = false;
		self.returnData = self.rawData;
	}
		
	// TODO: This error is general
	if( JSON && typeof( self.returnData ) == 'string' && self.returnData.charAt( 0 ) == '{' )
	{
		try
		{
			var t = JSON.parse( self.returnData );
			// Deprecate from 1.0 beta 2 "no user!"
			if( t && ( t.response.toLowerCase() == 'user not found' || t.response.toLowerCase() == 'user session not found' ) )
			{
				if( window.Workspace && t.response.toLowerCase() == 'user session not found' ) 
					Workspace.flushSession();
				if( Workspace )
				{
					// Add to queue
					AddToCajaxQueue( self );
					return Workspace.relogin();
				}
			}
		}
		catch( e )
		{
			if( !self.rawData )
			{
				//console.log( '[cAjax] Could not understand server response: ', self.returnData );
				self.destroy();
				return;
			}
			else
			{
				// console.log( 'Test3: Impossible server response: ', self.returnData );
			}
		}
	}
	// Respond to old expired sessions!
	else if( self.returnCode == 'fail' )
	{
		try
		{
			var r = JSON.parse( self.returnData );
			if( r.response.toLowerCase() == 'user session not found' )
			{
				if( window.Workspace )
					Workspace.flushSession();
				AddToCajaxQueue( self );
				return Workspace.relogin();
			}
		}
		catch( e )
		{
			//console.log( 'Test3: Impossible server response: ', self.returnData, self.returnData, wsdata );
		}
	}

	//simulate HTTP response string with escaped slashes...
	if( typeof( self.returnData ) == 'string' )
	{
		if( self.returnData.length > 0 && !self.returnCode )
		{
			self.returnCode = 'ok';
		}
	}
	if( self.onload )
	{
		self.onload( self.returnCode, self.returnData );
	}
	else
	{
		//console.log( 'got ws data... but nowhere to send it' );
	}
	
	self.destroy();
}

if( typeof bindSingleParameterMethod != 'function' )
{
	function bindSingleParameterMethod( toObject, methodName )
	{
    	return function(e){ toObject[ methodName ]( e ) }
	};
}


