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

/** @file
 *
 *  Friend Mind
 *
 *  Friend Mind is the client side node of the liquid artificial intelligence
 *  system based on human language
 *  PS: Look at frienddos.js for the prototype of how the language engine
 *  interacts with a Friend application object
 *
 *  @author FL (Francois Lionet)
 *  @author HT (Hogne Titlestad)
 *  @date pushed 2/12/2016
 */

// Just create the object
FriendMind = {
	sessions: {},
	getSession: function( id )
	{
		var test = this.sessions[id];
		if( test ) return test;
		return false;
	},
	makeSession: function( appObject )
	{
		var id = appObject.applicationId ? appObject.applicationId : appObject.sessionId;
		if( !this.sessions[id] )
		{
			// Setup session object
			this.sessions[id] = {
				created: ( new Date() ).getTime(),
				sessionId: id,
				parse: function( args, callback )
				{
					FriendMind.parse( this.sessionId, args, callback );
				}
			};
			return this.sessions[id];
		}
	},
	parse: function( sessionId, args, callback )
	{	
		// Assume we didn't manage to do anything...
		var result = false;
	
	
		var sessOb = this.getSession( sessionId );
		if( !sessOb )
		{
			if( callback ) callback( false, { response: 'Could not get mind session.' } );
			return false;
		}
		
		// Do all the parsing here! This is our AI ear!
		if( 1 == 2 )
		{
			// Logic goes here..
		}
		else
		{
			response = { response: 'Could not understand you.' };
		}
	
		// If we have a callback, send the result
		if( callback ) callback( result, response );
		
		// Return if used in a normal way
		return result;
	}
};

