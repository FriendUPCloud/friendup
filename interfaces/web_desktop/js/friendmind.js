/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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

