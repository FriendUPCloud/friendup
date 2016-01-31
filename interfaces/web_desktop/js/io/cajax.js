/*******************************************************************************
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
*******************************************************************************/

// A simple ajax function
cAjax = function()
{
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
		if( this.readyState == 4 && this.status == 200 )
		{
			jax.rawData = this.responseText;
			if( this.hasReturnCode )
			{
				var r = this.responseText.split( '<!--separate-->' );
				jax.returnCode = r[0];
				jax.returnData = r[1];
			}
			else
			{
				jax.returnCode = false;
				jax.returnData = this.responseText;
			}
			// Execute onload action with appropriate data
			if( jax.onload )
				jax.onload( jax.returnCode, jax.returnData );
		}
	}
}

// Open an ajax query
cAjax.prototype.open = function( method, url, syncing, hasReturnCode )
{
	// Try websockets!!
	/*if( Doors.websocket && Doors.websocket.ws )
	{
		this.mode == 'websocket';
		return true;
	}*/
	
	if( !method ) method = 'POST';
	else method = method.toUpperCase();
	if( !syncing ) syncing = true;
	if( !hasReturnCode ) hasReturnCode = false;
	this.method = method.toUpperCase();
	this.url = url;
	this.proxy.hasReturnCode = hasReturnCode;
	return this.proxy.open( method, url, syncing );
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

	/*
	// TODO: Check that the websocket actually is OPEN (Chrome being silly)
	if( Doors && Doors.websocket && !this.url.match(/\/[a-zA-Z]+\.library.*$/) )
	{
		var req = {'cmd': 'xhr', 'path': this.url, 'method': this.method, 'data': this.data ? this.data : this.vars};
		Doors.websocket.send_(req, function(data){
			self.wsData = data;
			self.onload( 200, data );
		});
	}
	else */
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
			this.proxy.send ( out.join ( '&' ) );
		}
		// All else fails?
		else
		{
			try { this.proxy.send ( null ); }
			catch ( e ) { this.proxy.send ( NULL ); }
		}
	}
	// Normal GET request
	else
	{
		this.proxy.setRequestHeader( 'Method', 'GET ' + this.url + ' HTTP/1.1' );
		try { this.proxy.send ( null ); }
		catch ( e ) { this.proxy.send ( NULL ); }
	}
}

