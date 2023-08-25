/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var Player = function( name )
{
	this.init( name );
}

Player.prototype.init = function( name )
{
	this.name = name;
	this.score = 0;
	this.level = 0;
	this.avatarImage = '';
}

