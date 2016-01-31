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

// Simple abstraction for FriendUP modules
var FriendLibrary = function ( library )
{
	// Get cleaned library
	this.library = library.split( '.library' ).join ( '' ).toLowerCase();
	this.args = false;
	this.method = false;
	this.vars = [];
	
	this.addVar = function( k, value )
	{
		this.vars[k] = value;
	}

	// Execute a method to a Friend UP module
	this.execute = function( method, args )
	{
		if ( method )  this.method = method;

		var j = new cAjax ();		
		
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
							j.addVar( a, JSON.stringify( args[a] ) );
						else j.addVar( a, args[a] );
					}
				}
			}
		}
		
		j.open ( 'post', '/' + this.library + '.library/' + this.method + ex, true, true );
		
		j.addVar( 'sessionid', Doors.sessionId );
		
		// Add vars
		for ( var a in this.vars ) 
			j.addVar( a, this.vars[a] );
		
		if ( this.onExecuted )
		{
			var t = this;
			j.onload = function ()
			{
				try
				{
					var json = JSON.parse( this.responseText() );
					if( json )
					{
						return t.onExecuted( json );
					}
				}
				catch( e )
				{
					var data = this.returnData;
					if ( data && data.length )
					{
						for ( var z in t.replacements )
						{
							data = data.split ( '{'+z+'}' ).join ( t.replacements[z] );
						}
					}
					t.onExecuted ( this.returnCode, data );
				}
			}
		}
		
		j.send ();
	}
}

