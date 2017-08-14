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

var _cajax_process_count = 0;

var _cajax_connection_seed = Math.random(0,999)+Math.random(0,999)+Math.random(0,999) + '_';
var _cajax_connection_num = 0;

// A simple ajax function
cAjax = function()
{
	// Make sure to track object in case of renewal...
	if( typeof( friend ) != 'undefined' )
	{
		if( !friend.cajax ) friend.cajax = [];
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
	
	this.vars = [];
	this.mode = 'ajax';
	this.varcount = 0;
	
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
			//console.log( '* We are ready ajax: ' + this.readyState + ' ' + this.status + '(' + typeof( jax.df ) + ')' );
			
			// Delete cancellable network connection
			if( jax.df ) jax.df.delConnection( jax.connectionId );
		
			// Update process count and set loading
			jax.decreaseProcessCount();
			
			jax.rawData = this.responseText;
			
			if( this.hasReturnCode )
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
			if( JSON && jax.rawData.charAt( 0 ) == '{' )
			{
				try
				{
					var t = JSON.parse( jax.rawData );
					// Deprecate from 1.0 beta 2 "no user!"
					if( t && ( t.response == 'user not found' || t.response == 'user session not found' ) )
					{
						if( Workspace )
						{
							// Drop these (don't retry!) because of remote fs disconnect
							if( jax.url.indexOf( 'file/info' ) > 0 )
								return;
							// Add to queue
							friend.cajax.push( jax );
							return Workspace.relogin();
						}
					}
				}
				catch( e )
				{
					if( !jax.rawData )
					{
						if( Workspace )
						{
							friend.cajax.push( jax );
							return Workspace.relogin();
						}
					}
				}
			}
			// Respond to old expired sessions!
			else if( jax.returnCode == 'fail' )
			{
				try
				{
					var r = JSON.parse( jax.returnData );
					if( r.response == 'user session not found' )
					{
						friend.cajax.push( jax );
						return Workspace.relogin();
					}
				}
				catch( e )
				{
				}
			}
			
			// Clean out possible queue
			var o = [];
			for( var a = 0; a < friend.cajax.length; a++ )
			{
				if( friend.cajax[a] != jax )
					o.push( friend.cajax[a] );
			}
			friend.cajax = o;
			// End clean queue
			
			// Register send time
			if( jax.sendTime && jax.df )
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
		}
		// Something went wrong!
		else if( this.readyState == 4 && ( this.status == 500 || this.status == 0 || this.status == 404 ) )
		{
			//console.log( '* Error ajax: ' + this.readyState + ' ' + this.status );
			
			// Delete cancellable network connection
			if( jax.df ) jax.df.delConnection( jax.connectionId );
			
			// Update process count and set loading
			jax.decreaseProcessCount();
			
			// Clean out possible queue
			var o = [];
			for( var a = 0; a < friend.cajax.length; a++ )
			{
				if( friend.cajax[a] != jax )
					o.push( friend.cajax[a] );
			}
			friend.cajax = o;
			// End clean queue

			// tell our caller...
			if( jax.onload ) jax.onload( 'fail', false );
		}
		else
		{
			//console.log( '* Idling ajax: ' + this.readyState + ' ' + this.status );
		}
	}
}

// Open an ajax query
cAjax.prototype.open = function( method, url, syncing, hasReturnCode )
{
	// Try websockets!!
	if( 
		typeof Workspace != 'undefined' && 
		Workspace.conn && 
		Workspace.conn.ws && 
		!Workspace.websocketsOffline && 
		typeof( url ) == 'string' && 
		url.indexOf( 'system.library' ) >= 0 
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
		return this.proxy.open( this.lastOptions.method, this.lastOptions.url, this.lastOptions.syncing );
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
	return this.proxy.open( method, url, syncing );
}

// Close it!
cAjax.prototype.close = function()
{
	// Abort connection
	this.decreaseProcessCount();
	this.proxy.abort();	
	if( this.df ) this.df.delConnection( this.connectionId );
}

// Add a variable to ajax query
cAjax.prototype.addVar = function( key, val )
{
	if( typeof( this.vars[key] ) == 'undefined' )
		this.varcount++;
	this.vars[key] = encodeURIComponent( val );
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
		i += Math.floor(Math.random()*1000) + '';
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

	// Update process count and set loading
	_cajax_process_count++;
	
	// Add cancellable network connection
	if( this.df ) this.df.addConnection( this.connectionId, this.url, this );
	
	if( ge( 'Screens' ) )
	{
		var titleBars = document.getElementsByClassName( 'TitleBar' );
		for( var b = 0; b < titleBars.length; b++ )
		{
			titleBars[b].classList.add( 'Busy' );
			document.body.classList.add( 'Busy' );
		}
	}

	// TODO: Check that the websocket actually is OPEN (Chrome being silly)
	if( self.mode == 'websocket' && Workspace.conn && Workspace.conn.ws )
	{
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
        self.wsRequestID = reqID;
		return;
	}


	// standard HTTP way....
	// Now
	this.sendTime = ( new Date() ).getTime();
	
	if( this.method == 'POST' )
	{
		var u = this.url.split( '?' );
		u = u[0] + '?' + ( u[1] ? ( u[1]+'&' ) : '' ) + 'cachekiller=' + this.getRandNumbers();
		this.proxy.setRequestHeader( 'Method', 'POST ' + u + ' HTTP/1.1' );
		this.proxy.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
		// Send data
		if( data ) 
		{
			this.proxy.send( data );
		}
		else if( this.varcount > 0 )
		{
			var out = [];
			for( var a in this.vars )
				out.push( a + '=' + this.vars[a] );
			var res = this.proxy.send( out.join ( '&' ) );
		}
		// All else fails?
		else
		{
			try { this.proxy.send ( null ); }
			catch ( e ) { this.proxy.send( NULL ); }
		}
		
		//console.log( 'Posting ' + u );
	}
	// Normal GET request
	else
	{
		var u = this.url.split( '?' );
		u = u[0] + '?' + ( u[1] ? ( u[1]+'&' ) : '' ) + 'cachekiller=' + this.getRandNumbers();
		this.proxy.setRequestHeader( 'Method', 'GET ' + u + ' HTTP/1.1' );
		try { this.proxy.send( null ); }
		catch ( e ) { this.proxy.send( NULL ); }
		
		//console.log( 'Getting ' + u );
	}
}

cAjax.prototype.decreaseProcessCount = function()
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

cAjax.prototype.handleWebSocketResponse = function( wsdata )
{	
	var self = this;
	
	// Delete cancellable network connection
	if( this.df ) this.df.delConnection( this.connectionId );
	
	// Update process count and set loading
	this.decreaseProcessCount();
	
	if( typeof( wsdata ) == 'object' && wsdata.response )
	{
		self.rawData = 'fail';
		self.proxy.responseText = self.rawData;
		self.returnCode = 'fail';
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
		if( self.rawData.indexOf( sep ) > 0)
		{
			self.returnCode = self.rawData.substr( 0, self.rawData.indexOf( sep ) );
			self.returnData = self.rawData.substr( self.rawData.indexOf( sep ) + sep.length );
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
					friend.cajax.push( self );
					return Workspace.relogin();
				}
			}
		}
		catch( e )
		{
			if( !self.rawData )
			{
				if( Workspace )
				{
					friend.cajax.push( self );
					return Workspace.relogin();
				}
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
				friend.cajax.push( self );
				return Workspace.relogin();
			}
		}
		catch( e )
		{
		}
	}

	//simulate HTTP response string with escaped slashes...
	if( typeof( self.returnData ) == 'string' )
	{
		if( self.returnData.length > 0 && !self.returnCode )
			self.returnCode = 'ok';
	}
	if( self.onload )
	{
		self.onload( self.returnCode, self.returnData );
	}
	else
	{
		console.log( 'got ws data... but nowhere to send it' );
	}
}

if( typeof bindSingleParameterMethod != 'function' )
{
	function bindSingleParameterMethod(toObject, methodName){
    	return function(e){toObject[methodName](e)}
	};
}

