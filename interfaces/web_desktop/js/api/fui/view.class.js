/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

FUI.View = function( object )
{
	FUI.inherit( this );
	this.flags = object;
}

FUI.View.Create = function( object )
{
	let v = new FUI.View( object );
	v.setIdentity(); 
	return v;
}

FUI.View.Populate = function( data )
{
	
}
