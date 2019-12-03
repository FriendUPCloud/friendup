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

var _cajax_queue = [];
var _cajax_file_queue = [];
var _cajax_send_interval = null;
var _cajax_queue_length = 10;
var _cajax_file_process_count = 0;

// For debug
var _c_count = 0;
var _c_destroyed = 0;

// Kill all ajax calls by context
// TODO: Test if it is dangerous!
function KillcAjaxByContext( context )
{
	var q = [];
	for( var a = 0; a < _cajax_queue; a++ )
	{
		if( _cajax_queue[ a ].context == context )
		{
			_cajax_queue[ a ].destroy();
		}
		else q.push( _cajax_queue[ a ] );
	}
	_cajax_queue = q;
}

function AddToCajaxQueue( ele )
{
	// If we're queueing it
	if( ele.onQueue ) ele.onQueue();
	
	// Don't add to queue if we are offline
	if( !Workspace.serverIsThere || Workspace.workspaceIsDisconnected )
	{
		if( ele.onload )
		{
			// // console.log( 'Test2: Just fail!' );
			ele.onload( false );
		}
		// // console.log( 'Test2: Destroy ajax object.' );
		return ele.destroy();
	}
	
	// TODO: Support a nice queue.. :-)
	if( !window.Friend || !window.Friend.cajax )
	{
		console.log( 'Impossible error' );
		return false;
	}
	for( var a = 0; a < Friend.cajax.length; a++ )
	{
		// Already there
		if( Friend.cajax[a] == ele ) return false;
	}
	// // console.log( 'Test2: Add ajax element to queue.' );
	Friend.cajax.push( ele );
}

// A simple ajax function
cAjax = function()
{
	this.openFunc = null;
	this.opened = false;
	this.context = false; // Named contexts, so that we can kill an entire context
	
	//_c_count++;
	//console.log( 'cAjax: Created ' + _c_count );

	// Make sure to track object in case of renewal...
	if( typeof( Friend ) != 'undefined' )
	{
		if( !Friend.cajax ) Friend.cajax = [];
	}
	
	// Get deepest field
	this.df = typeof( DeepestField ) != 'undefined' ? DeepestField : false;
	if( !this.df )
	{
		try
		{
			this.df = typeof( parent.DeepestField ) != 'undefined' ? parent.DeepestField : false;
		}
		catch( e )
		{};
	}
	if( this.df )
	{
		// Create a unique id
		_cajax_connection_num++;
		if( _cajax_connection_num > 1073741824 )
			_cajax_connection_num = 0;
		this.connectionId = _cajax_connection_seed + _cajax_connection_num;
	}
	
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
			// console.log( 'Test3: onreadystatechange 200 - Here we go: ', jax.url, this.response );
			
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
						if( t && ( res == 'user not found' || res == 'user session not found' ) )
						{
							if( Workspace )
							{
								// Drop these (don't retry!) because of remote fs disconnect
								if( jax.url.indexOf( 'file/info' ) > 0 )
									return;
								console.log( '[cAjax 2] Doing a relogin (no user session)' );
								console.trace();
								// Add to queue
								AddToCajaxQueue( jax );
								Workspace.flushSession();
								return Workspace.relogin();
							}
						}
					}
					catch( e )
					{
						if( !jax.rawData )
						{
							console.log( '[cAjax] Can not understand server response: ', jax.rawData );
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
						
						if( res == 'user not found' || res == 'user session not found' )
						{
							if( window.Workspace && Workspace.postInitialized && Workspace.sessionId )
							{
								console.log( '[cAjax 3] Doing a relogin (no user session: ' + Workspace.sessionId + ')', jax.vars );
								console.trace();
							
								// Add to queue
								AddToCajaxQueue( jax );
								Workspace.flushSession();
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
			
			// Clean out possible queue
			var o = [];
			for( var a = 0; a < Friend.cajax.length; a++ )
			{
				if( Friend.cajax[a] != jax )
					o.push( Friend.cajax[a] );
			}
			Friend.cajax = o;
			// End clean queue
			
			// Register send time
			if( jax.sendTime && jax.df && jax.df.available )
			{
				var ttr = ( new Date() ).getTime() - jax.sendTime;
				jax.sendTime = false;
				jax.df.networkActivity.timeToFinish.push( ttr );
			}

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
			// Clean out possible queue
			var o = [];
			for( var a = 0; a < Friend.cajax.length; a++ )
			{
				if( Friend.cajax[a] != jax )
					o.push( Friend.cajax[a] );
			}
			Friend.cajax = o;
			// End clean queue

			// console.log( 'Test3: ' + this.readyState + ' ' + this.status, this.response );

			// tell our caller...
			if( jax.onload ) jax.onload( 'fail', false );
			jax.destroy();
		}
		else
		{
			//console.log( '* Idling ajax: ' + this.readyState + ' ' + this.status );
		}
	}
}

// Clean up object
cAjax.prototype.destroy = function()
{
	//_c_destroyed++;
	//console.log( 'cAjax: ' + _c_count + ' created and ' + _c_destroyed + ' destroyed' );

	// No more activity here!
	this.decreaseProcessCount();
	if( this.opened )
		this.close();
	if( this.df && this.df.available ) this.df.delConnection( this.connectionId );
	
	// Null all attributes
	if( this.dfTimeout ) clearTimeout( this.dfTimeout );
	this.dfTimeout = null;
	this.df = null;
	this.vars = null;
	this.mode = null;
	this.url = null;
	this.hasReturnCode = null;
	this.lastOptions = null;
	this.proxy = null;
	if( this.worker )
		this.worker.terminate();
	this.worker = null;
	this.rawData = null;
	this.varcount = null;
	this.wsRequestID = null;
	this.wsData = null;
	this.connectionId = null;
	this.sendTime = null;
	this.hasReturnCode = null;
	this.method = null;
	this.onload = null;
	this.queued = null;
	this.openFunc = null;
	this.fileQueue = null;
	
	// finally
	delete this;
}

// Open an ajax query
cAjax.prototype.open = function( method, url, syncing, hasReturnCode )
{
	var self = this;
	
	this.opened = true;
	
	// Try websockets!!
	if( 
		!this.forceHTTP &&
		this.proxy.responseType != 'arraybuffer' &&
		typeof Workspace != 'undefined' && 
		Workspace.conn && 
		Workspace.conn.ws && 
		!Workspace.websocketsOffline && 
		Workspace.websocketState == 'open' &&
		typeof( url ) == 'string' && 
		url.indexOf( 'system.library' ) >= 0 && 
		url.indexOf( '/file' ) < 0 
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
		this.openFunc = function(){ self.proxy.open( self.lastOptions.method, self.lastOptions.url, self.lastOptions.syncing ); };
		return;
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
	}
	this.openFunc = function(){ self.proxy.open( self.method, self.url, syncing ); };
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
cAjax.prototype.send = function( data )
{
	var self = this;

	// Wait in case of relogin
	if( typeof( Workspace ) != 'undefined' && Workspace.reloginInProgress && !this.forceSend )
	{
		AddToCajaxQueue( self );
		return;
	}

	// If we're in the queue, skip
	if( this.queued ) return;
	
	if( this.mode == 'websocket' && this.proxy.responseType == 'arraybuffer' )
	{
		this.mode = '';
	}
	
	
	// Which queue this goes into
	this.fileQueue = this.url && this.url.substr( this.url.length - 5, 5 ) == '/copy';

	// TODO: Research why this is a problem!
	var pcount = _cajax_process_count;
	var queue = _cajax_queue;
	
	if( this.fileQueue )
	{
		pcount = _cajax_file_process_count;
		queue = _cajax_file_queue;
	}
	
	// If we're not in the queue, and 
	if( pcount > _cajax_queue_length )
	{
		if( !_cajax_send_interval )
		{
			_cajax_send_interval = setInterval( function()
			{
				var f = [];
				// Take this current queue
				for( var a = 0; a < _cajax_file_queue.length; a++ )
				{
					var q = _cajax_file_queue[ a ];
					if( a < _cajax_queue_length )
					{
						try
						{
							ret = q();
						}
						catch( e )
						{
							console.log( 'This ajax file object does not exist.' );
						}
					}
					else
					{
						f.push( q );
					}
				}
				// Cleaned list
				_cajax_file_queue = f;
				
				var o = [];
				// Take this current queue
				for( var a = 0; a < _cajax_queue.length; a++ )
				{
					var q = _cajax_queue[ a ];
					if( a < _cajax_queue_length )
					{
						try
						{
							ret = q();
						}
						catch( e )
						{
							console.log( 'This ajax object does not exist.' );
						}
					}
					else
					{
						o.push( q );
					}
				}
				// Cleaned list
				_cajax_queue = o;
				
				// Check
				if( !f.length && !o.length )
				{
					clearInterval( _cajax_send_interval );
					_cajax_send_interval = null;
				}
			}, 100 );
		}
		
		// Copy goes in the file queue if server is there
		if( Workspace.serverIsThere )
		{
			var of = function()
			{
				self.queued = false;
				self.send( data, true );
			}
			this.queued = true;
			queue.push( of );
		}
		else
		{
			this.destroy();
		}
		return;
	}
	
	// Only if successful
	function successfulSend( addBusy )
	{
		// Update process count and set loading
		if( self.fileQueue )
			_cajax_file_process_count++;
		else _cajax_process_count++;
		if( addBusy )
		{
			if( ge( 'Screens' ) )
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
	if( self.mode == 'websocket' && Workspace.conn && Workspace.conn.ws && Workspace.websocketState == 'open' )
	{
		//console.log( 'Test2: Sending ajax call with websockets.' );
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
			//console.log('we need to add this here as data', u[1]);
			//console.log( u[1] );
			var pairs = u[1].split( '&' );
			for( var a = 0; a < pairs.length; a++ )
			{
				var p = pairs[a].split( '=' );
				wsdata[p[0]] = p[1];
			}
			//console.log( 'Out:', wsdata );
        }
        else
        {
        	//console.log( wsdata );
        }
        
        var req = {
                path : u[0].substr(1),
                data : wsdata
        };
        
        var reqID = Workspace.conn.request( req, bindSingleParameterMethod( self, 'handleWebSocketResponse' ) );
        
        if( typeof( reqID ) != 'undefined' && !reqID )
        {
        	AddToCajaxQueue( self );
			Workspace.flushSession();
			return Workspace.relogin();
        }
        else if( typeof( reqID ) == 'undefined' )
        {
        	console.log( 'cAjax: Request was undefined.' );
        }
        else
        {
        	// console.log( 'Test3: We got requestID: ' + reqID );
        }
        
        self.wsRequestID = reqID;
		
		// Add cancellable network connection
		if( this.df && this.df.available ) 
		{
			// Don't overkill - only add connections taking more than 500 ms
			self.dfTimeout = setTimeout( function()
			{
				self.df.addConnection( self.connectionId, self.url, self );
			}, 500 );
		}
		// Not for module calls
		var addBusy = true;
		if( self.url.indexOf( 'module/' ) < 0 ) 
		{
			addBusy = false;
		}
		successfulSend( addBusy );
		
		return;
	}

	// console.log( 'Test2: Sending ajax request with standard sockets.' );

	// standard HTTP way....
	// Now
	this.sendTime = ( new Date() ).getTime();
	
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
				res = this.proxy.send( data );
			}
			else if( this.varcount > 0 )
			{
				var out = [];
				for( var a in this.vars )
					out.push( a + '=' + this.vars[a] );
				res = this.proxy.send( out.join ( '&' ) );
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
			succsessfulSend();
			// Add cancellable network connection
			if( this.df && this.df.available ) 
			{
				// Don't overkill - only add connections taking more than 500 ms
				self.dfTimeout = setTimeout( function()
				{
					self.df.addConnection( self.connectionId, self.url, self );
				}, 500 );
			}
		}
		return;
	}
	// We were not successful!
	this.destroy();
}

cAjax.prototype.decreaseProcessCount = function()
{
	if( this.fileQueue )
	{
		_cajax_file_process_count--;
		if( _cajax_file_process_count < 0 )
			_cajax_file_process_count = 0;
	}
	else
	{
		_cajax_process_count--;
		if( _cajax_process_count <= 0 )
		{
			_cajax_process_count = 0;
			if( ge( 'Screens' ) )
			{
				var titleBars = document.getElementsByClassName( 'TitleBar' );
				for( var b = 0; b < titleBars.length; b++ )
				{
					titleBars[b].classList.remove( 'Busy' );
					document.body.classList.remove( 'Busy' );
				}
			}
		}
	}
}

cAjax.prototype.handleWebSocketResponse = function( wsdata )
{	
	var self = this;
	
	// console.log( 'Test3: Handling websocket response: ', wsdata );
	
	// The data just failed - which means the websocket went away!
	if( typeof( wsdata ) == 'undefined' )
	{
		if( Workspace )
		{
			// Add to queue
			//console.log( '[cAjax 5] Doing a relogin (no user session)' );
			//console.trace();
			// Add to queue
			AddToCajaxQueue( self );
			Workspace.flushSession();
			return Workspace.relogin();
		}
		self.destroy();
		return;
	}
	
	if( typeof( wsdata ) == 'object' && wsdata.response )
	{
		self.rawData = 'fail';
		self.proxy.responseText = self.rawData;
		self.returnCode = 'fail';
		self.destroy();
		//// console.log( 'Test3: Failed', wsdata );
		return false;
	}
	
	self.proxy.responseText = wsdata;
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
			if( t && ( t.response == 'user not found' || t.response == 'user session not found' ) )
			{
				if( Workspace )
				{
					// Add to queue
					console.log( '[cAjax 2] Doing a relogin (no user session)' );
					console.trace();
					// Add to queue
					AddToCajaxQueue( self );
					Workspace.flushSession();
					return Workspace.relogin();
				}
			}
		}
		catch( e )
		{
			if( !self.rawData )
			{
				console.log( '[cAjax] Could not understand server response: ', self.returnData );
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
			if( r.response == 'user session not found' )
			{
				console.log( '[cAjax] Doing a relogin (no user session)' );
				console.trace();
				AddToCajaxQueue( self );
				Workspace.flushSession();
				return Workspace.relogin();
			}
		}
		catch( e )
		{
			// console.log( 'Test3: Impossible server response: ', self.returnData, self.returnData );
		}
	}

	//simulate HTTP response string with escaped slashes...
	if( typeof( self.returnData ) == 'string' )
	{
		if( self.returnData.length > 0 && !self.returnCode )
		{
			// console.log( 'Test3: What was assumed ok: ', self.returnData, self.returnData );
			self.returnCode = 'ok';
		}
	}
	if( self.onload )
	{
		self.onload( self.returnCode, self.returnData );
	}
	else
	{
		console.log( 'got ws data... but nowhere to send it' );
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


