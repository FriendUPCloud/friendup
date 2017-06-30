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

