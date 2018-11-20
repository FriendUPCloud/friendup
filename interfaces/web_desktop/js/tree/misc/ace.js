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
 * Tree engine ACE editor item
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 16/04/2018
 */
Friend = window.Friend || {};
Friend.Tree.Misc = Friend.Tree.Misc || {};
Friend.Tree.Misc.RenderItems = Friend.Tree.Misc.RenderItems || {};

Friend.Tree.Misc.Ace = function ( tree, name, properties )
{
	this.caller = false;
	this.renderItemName = 'Friend.Tree.Misc.RenderItems.Ace';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Misc.Ace', properties );
	
	// Load Ace
	var self = this;
	Friend.Tree.include( 
	[
		'/webclient/js/tree/misc/Ace/src-min-noconflict/ace.js'
	], function( response )
	{
		if ( response == 'OK' )
		{
			// Make sure we can run ace
			function delayedSetupAce()
			{
				if( typeof( ace ) != 'undefined' && ace )
				{					
					clearTimeout( self.timeoutAce );
					self.editor = ace.edit( "aceeditor" );
					self.editor.setTheme( "ace/theme/monokai" );
					self.editor.setFontSize( 14 );
					self.sessions = {};
					self.storedSessions = {};
					self.doRefresh();
				}
			}
			self.timeoutAce = setInterval( delayedSetupAce, 100 );	
		}
	} );
};
Friend.Tree.Misc.Ace.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.Misc.Ace.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.Misc.Ace.getSession = function ( path )
{
	return this.sessions[ path ];
};
Friend.Tree.Misc.Ace.openSession = function ( path, source )
{
	// If the session is already active, open it!
	if ( this.setSession( path ) )
		return path;

	// If it is stored in the storage area, use the data!
	var storage;
	if ( this.storedSessions[ path ] )
		storage = this.storedSessions[ path ];

	// New session! Get the mode depending on the file extension
	var mode;
	if ( !storage )
	{
		var extension = this.tree.utilities.getFileExtension( path );
		switch( extension )
		{
			case 'php':  mode = 'ace/mode/php';          break;
			case 'pl':   mode = 'ace/mode/perl';         break;
			case 'sql':  mode = 'ace/mode/sql';          break;
			case 'sh':   mode = 'ace/mode/batchfile';    break;
			case 'as':   mode = 'ace/mode/actionscript'; break;
			case 'css':  mode = 'ace/mode/css';          break;
			case 'txt':  mode = 'ace/mode/plain_text';   break;
			// TODO: Update with solidity syntax when available
			case 'sol':
				mode = 'ace/mode/javascript';
				break;
			case 'jsx':
				mode = 'ace/mode/javascript';
				break;
			case 'info':
			case 'json':
			case 'js':
			case 'url':
				mode = 'ace/mode/javascript';
				break;
			case 'tpl':
			case 'ptpl':
			case 'html':
			case 'htm':
				mode = 'ace/mode/html';
				break;
			case 'xml':  mode = 'ace/mode/xml';          break;
			case 'c':
			case 'h':
			case 'cpp':
				mode = 'ace/mode/c_cpp';
				break;
			case 'd':    mode = 'ace/mode/d';            break;
			case 'ini':  mode = 'ace/mode/ini';          break;
			case 'java': mode = 'ace/mode/java';         break;
			case 'run':
				mode = 'ace/mode/c_cpp';
				break;
			case 'apf':
			case 'conf':
				mode = 'ace/mode/plain_text';
				break;
			case 'lang':
			case 'md':
			default:
				mode = 'ace/mode/plain_text';
				break;
		}
	}
	else
	{
		mode = storage.mode;
	}

	// Create a new session
	var session = ace.require( 'ace/ace' ).createEditSession( source, mode );

	// If session was in storage, set the values
	if ( storage )
	{
		session.$undoManager.$doc = session; 				// NOTICE: workaround for a bug in ace
		session.setOptions( storage.options );
		if ( storage.history )
		{
			session.$undoManager.$undoStack = storage.history.undo;
			session.$undoManager.$redoStack = storage.history.redo;
		}
		if ( storage.selection )
			session.selection.fromJSON( storage.selection );
		if ( storage.scrollTop )
			session.setScrollTop( storage.scrollTop );
		if ( storage.scrollLeft )
			session.setScrollLeft( storage.scrollLeft );
	}

	// Store in array
	this.sessions[ path ] = 
	{
		session: session,
		path: path,
		mode: mode
	};
	this.setSession( path );
	return path;
};
Friend.Tree.Misc.Ace.setSession = function ( pathOrSession )
{
	var session = pathOrSession;
	if ( typeof pathOrSession == 'string' )
		session = this.sessions[ pathOrSession ];
	if ( !session )
		return false;

	// Set the previous session as inactive
	if ( this.activeSession )
		this.hideSession( this.activeSession );

	// Branch the new session
	this.editor.setSession( session.session );
	this.editor.session.setUseWorker( false );
	session.active = true;
	this.activeSession = session;
	return true;
};
Friend.Tree.Misc.Ace.hideSession = function ( pathOrSession )
{
	var session = pathOrSession;
	if ( typeof pathOrSession == 'string' )
		session = this.sessions[ pathOrSession ];
	if ( !session )
		return false;

	session.active = false;
	if ( session == this.activeSession )
		this.activeSession = false;
};
Friend.Tree.Misc.Ace.killSession = function ( pathOrSession )
{
	var session = pathOrSession;
	if ( typeof pathOrSession == 'string' )
		session = this.sessions[ pathOrSession ];
	if ( !session )
		return false;

	// Store session for re-opening
	this.storedSessions[ session.path ] = this.getSessionInfo( session, { history: true, selection: true, scrollTop: true, scrollLeft: true, options:true } );

	// Removes the session
	if ( session == this.activeSession )
		this.activeSession = false;
	this.sessions[ session.path ] = false;
	this.sessions = this.utilities.cleanArray( this.sessions );
	return true;
};
Friend.Tree.Misc.Ace.getSessionsInformation = function ()
{
	var information = {};

	// The stored sessions, without the history
	for ( var s in this.storedSessions )
	{
		var session = this.cloneSessionInfo( this.storedSessions[ s ], [ 'selection', 'scrollTop', 'scrollLeft', 'options' ] );
		information[ session.path ] = session;
	}

	// Add / replace for all open editors, without history
	for ( var s in this.sessions )
	{
		this.storedSessions[ s ] = this.getSessionInfo( this.sessions[ s ], { selection: true, scrollTop: true, scrollLeft: true, options:true } );
	}
	return this.storedSessions;
};
Friend.Tree.Misc.Ace.setSessionInformation = function ( information, rootPath, callback )
{
	if ( rootPath )
	{
		this.storedSessions = {};

		var self = this;
		DOS.fileExist( rootPath + information.path, function( response, config ) 
		{
			var found = false;
			if ( response.response == true )
			{
				self.storedSessions[ response.extra.path ] = response.extra;
				found = true;
			}
			if ( callback )
				callback( found );
		}, information );
	}
	else
	{
		this.storedSessions = information;
	}
};
Friend.Tree.Misc.Ace.cloneSessionInfo = function ( sessionInfo, properties )
{
	var newSessionInfo = 
	{
		mode: sessionInfo.mode,
		path: sessionInfo.path
	};
	for ( var p = 0; p < properties.length; p++ )
	{
		if ( sessionInfo[ properties[ p ] ] )
		{
			newSessionInfo[ properties[ p ] ] = sessionInfo[ properties[ p ] ];
		}
	}
	return newSessionInfo;
},
Friend.Tree.Misc.Ace.getSessionInfo = function ( session, properties )
{
	// Get storable session data 
	var filterHistory = function( deltas )
	{
		return deltas.filter( function( d )
		{
		    return d.group != "fold";
		} );
	};
	var storage = 
	{
		mode: session.mode,
		path: session.path
	};
	for ( var p in properties )
	{
		if ( properties[ p ] )
		{
			switch( p )
			{
				case 'selection':
					storage.selection = session.session.selection.toJSON();
					break;
				case 'history':
					storage.history = 
					{
						undo: session.session.$undoManager.$undoStack.map( filterHistory ),
						redo: session.session.$undoManager.$redoStack.map( filterHistory )
					};	
					break;
				case 'scrollTop':
					storage.scrollTop = session.session.getScrollTop();
					break;
				case 'scrollLeft':
					storage.scrollLeft = session.session.getScrollLeft();
					break;
				case 'options':
					storage.options = session.session.getOptions();
					break;
			}
		}
	}
	return storage;
};




Friend.Tree.Misc.RenderItems.Ace_HTML = function ( tree, name, properties )
{
	this.rendererName = '*';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Misc.RenderItems.Ace_HTML', properties );
	this.div = document.getElementById( 'aceeditor' );
	this.div.style.position = 'absolute';
};
Friend.Tree.Misc.RenderItems.Ace_HTML.render = function( properties )
{
	this.div.style.zIndex = properties.z;
    this.div.style.left = Math.floor( properties.x ) + 'px';
    this.div.style.top = Math.floor( properties.y ) + 'px';
    this.div.style.width = Math.floor( properties.width ) + 'px';
    this.div.style.height = Math.floor( properties.height ) + 'px';
	this.div.style.visibility = 'visible';	
	return properties;	
};
Friend.Tree.Misc.RenderItems.Ace_HTML.message = function ( message )
{
	switch ( message.command )
	{
		case 'resize':
			if ( message.width )
			{
				this.width = message.width;
				this.item.width = message.width;
			}
			if ( message.height )
			{
				this.height = message.height;
				this.item.height = message.height;
			}
			this.item.doRefresh( -1 );
			break;
		default:
			break;
	}
}
