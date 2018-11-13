/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = window.friendUP || {};
friendUP.io = friendUP.io || {};

// Request

( function( ns, undefined) {
	ns.Request = function( conf )
	{
		if ( !( this instanceof ns.Request ))
			return new ns.Request( conf );
		
		var self = this;
		
		// if you dont set these, jesus kills a kitten
		self.url = conf.url;
		self.successHandler = conf.success;
		self.errorHandler = conf.error;
		
		// useful, but optional
		self.data = conf.data || null;
		self.method = conf.method ? conf.method.toUpperCase() : 'GET';
		
		// extremely  optional
		self.async = conf.async || true;
		self.headers = conf.headers || null; // map ( key - value )
		self.user = conf.user || '';
		self.password = conf.password || '';
		
		self.init();
	}
	
	ns.Request.prototype.init = function()
	{
		var self = this;
		
		if ( !self.successHandler || !self.errorHandler )
			throw new Error( 'no succes or error handler' );
		
		self.readyStateMap = {
			'0' : unsent,
			'1' : sent,
			'2' : headers,
			'3' : loading,
			'4' : done
		};
		
		// TODO: fix this hack
		if ( Doors.sessionId ) {
			self.data[ 'sessionid' ] = Doors.sessionId;
		}
		
		self.request = new window.XMLHttpRequest();
		self.request.onreadystatechange = onReadyState;
		self.setData();
		self.open();
		self.addHeaders();
		self.send();
		
		function onReadyState( e ) { self.onReadyState( e ); }
		function unsent( e ) { console.log( 'readyState - unsent', e ); }
		function sent( e ) { console.log( 'readyState - sent', e ); }
		function headers( e ) { console.log( 'readyState - headers received', e ); }
		function loading( e ) { console.log( 'readyState - loading', e ); }
		function done( e ) { self.done( e.target ); }
	}
	
	ns.Request.prototype.onReadyState = function( e )
	{
		var self = this;
		//console.log( 'io.Request.onReadyState.e', e );
		var state = e.target.readyState.toString();
		self.readyStateMap[ state ]( e );
	}
	
	ns.Request.prototype.done = function( response )
	{
		var self = this;
		console.log( 'io.Request.done', response );
		if ( response.status == 200 )
			self.success({
				status : response.status,
				data : response.response
			});
		else
			self.error( response );
	}
	
	ns.Request.prototype.success = function( msg )
	{
		var self = this;
		if ( self.successHandler )
			self.successHandler( msg );
	}
	
	ns.Request.prototype.error = function( e )
	{
		var self = this;
		console.log( 'io.Request.error.e', e );
		if ( self.errorHandler )
			self.errorHandler( e );
	}
	
	ns.Request.prototype.abort = function()
	{
		var self = this;
		self.req.abort();
	}
	
	ns.Request.prototype.setData = function()
	{
		var self = this;
		
		if ( !self.data )
			return;
		
		if ( self.method == 'GET')
			self.url += '?' + getQueryString( self.data );
		else
			self.data = getQueryString( self.data );
		
		function getQueryString( params )
		{
			if ( typeof( params ) === 'string' )
				return params;
				
			var pairs = Object.keys( params ).map( pair )
			function pair( key )
			{
				var value = params[ key ];
				return key + '=' + value;
			}
			
			return pairs.join( '&' );
		}
		
	}
	
	ns.Request.prototype.open = function()
	{
		var self = this;
		self.request.open(
			self.method,
			self.url,
			self.async,
			self.user,
			self.password
		);
	}
	
	ns.Request.prototype.addHeaders = function()
	{
		var self = this;
		
		if ( self.method === 'GET' )
			return;
		
		var headers = self.headers || {
			'Content-Type' : 'application/x-www-form-urlencoded',
		};
		//headers[ 'Content-Length' ] = self.data.length;
		
		Object.keys( headers ).forEach( add );
		function add( header )
		{
			var value = headers[ header ].toString();
			self.request.setRequestHeader( header, value );
		}
	}
	
	ns.Request.prototype.send = function()
	{
		var self = this;
		if ( self.method == 'GET' )
			self.request.send();
		else
			self.request.send( self.data );
	}
	
})( friendUP.io )
