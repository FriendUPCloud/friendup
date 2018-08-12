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

var friendUP = window.friendUP || {};
friendUP.io = friendUP.io || {};

// Simple abstraction for FriendUP modules
var Module = function( mod )
{
	this.module = mod;
	this.args = false;
	this.command = false;
	this.vars = [];
	
	this.addVar = function( k, value )
	{
		this.vars[k] = value;
	}

	this.destroy = function()
	{
		this.module = null;
		this.args = null;
		this.command = null;
		this.vars = null;
		if( this.lastJax )
			this.lastJax.destroy();
		delete this;
	}

	// Execute a command to a Friend UP module
	this.execute = function( cmd, args )
	{
		if( cmd  ) this.command = cmd;
		if( args ) this.args = args;
		
		var j = new cAjax ();
		
		j.open( 'post', '/system.library/module/', true, true );
		
		// Make sure we can read args (from the myriad of places )
		var authId = false;
		if( args )
		{
			if( args.authid ) authId = args.authid;
			else if( args.args ) if( args.args.authid ) authId = args.args.authid;
		}
		if( !authId && Workspace.authId ) authId = Workspace.authId;
		// Done with authid here
		
		// authid
		if( authId ) j.addVar( 'authid', authId   );
		// session id
		else if( Workspace.sessionId ) j.addVar( 'sessionid', Workspace.sessionId );
		j.addVar( 'module',    this.module                  );
		j.addVar( 'args',      JSON.stringify( this.args )  );
		j.addVar( 'command',   this.command                 );
		
		for( var a in this.vars ) j.addVar( a, this.vars[a] );
			
		// Force http!
		if( this.forceHTTP )
			j.forceHTTP = true;
		if( this.forceSend )
			j.forceSend = true;
		
		if( this.onExecuted )
		{
			var t = this;
			
			j.onload = function( rc, rd )
			{
				var data = rd;
				if( data && data.length )
				{
					for( var z in t.replacements )
					{
						data = data.split( '{'+z+'}' ).join ( t.replacements[z] );
					}
				}
				t.onExecuted( rc, data );
				t.destroy();
			};
		}
		j.send();
		if( this.lastJax )
			this.lastJax.destroy();
		this.lastJax = j;
	}
};

// Module
(function( ns, undefined )
{
	ns.Module = function( conf, callback )
	{
		if ( !( this instanceof ns.Module ))
			return new ns.Module( conf, callback );
		
		var self = this;
		self.module = conf.module || 'system';
		self.command = conf.command;
		self.args = conf.args || {};
		self.callback = callback;
		
		self.init();
	}
	
	ns.Module.prototype.init = function()
	{
		var self = this;
		if ( !self.callback )
			throw new Error( 'friendUP.io.Module - no callback' );
		
		self.args[ 'module' ] = self.module;
		self.args[ 'command' ] = self.command;
		
		var reqConf = {
			method : 'POST',
			url : '/system.library/module',
			data : self.args,
			success : success,
			error : error
		};
		var req = new friendUP.io.Request( reqConf );
		
		function success( e ) { self.done( e ); }
		function error( e ) { console.log( 'io.Module - request failed', e ); }
	}
	
	ns.Module.prototype.done = function( response )
	{
		var self = this;
		var json = friendUP.tool.objectify( response.data );
		response.data = json || response.data;
		self.callback( response );
	}
	
})( friendUP.io );

