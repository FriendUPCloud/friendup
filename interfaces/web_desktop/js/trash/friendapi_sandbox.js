/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Create a friend application (API v1)
function FriendApplication( args )
{
	this.masterView = false;
}
// Translates a keyword
FriendApplication.prototype.i18n = function( keyword )
{
	if( typeof( ____translations[keyword] ) != 'undefined' )
		return ____translations[keyword];
	return keyword;
}
// Sets master view
FriendApplication.prototype.setMasterView = function( wobj )
{
	this.masterView = wobj;
}
FriendApplication.prototype.openLibrary = function( authkey, path, id, container )
{
	return document.api.openLibrary( authkey, path, id, container );
}


// Proxy class to open a new window --------------------------------------------
function View( flags )
{
	var w = document.api.createView( flags );
	for ( var a in w ) 
		this[a] = w[a];
}

// Proxy class to open a new screen --------------------------------------------
function Screen( flags )
{
	var w = document.api.createScreen( flags );
	for ( var a in w ) 
		this[a] = w[a];
}

// Proxy class to handle doors -------------------------------------------------
function Door( authkey, path )
{
	var d = document.api.createDoor( authkey, path );
	for( var a in d )
		this[a] = d[a];
	d.proxy = this;
	return this;
}

// Proxy class to abstract files -----------------------------------------------
function File( authkey, path )
{
	var f = document.api.createFile( authkey, path );
	for ( var a in f )
		this[a] = f[a];
	f.proxy = this;
}

// Proxy class to abstract modules ---------------------------------------------
function Module( authkey, mod )
{
	var m = document.api.createModule( authkey, mod );
	for( var a in m[a] )
		this[a] = f[a];
	m.proxy = this;
}

