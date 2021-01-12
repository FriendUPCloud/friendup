/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

fui.addClass( function()
{
	fui.Desklet = fui.inherit( fui.View.prototype );

	fui.Desklet.prototype.create = function( flags )
	{
		this.baseClassName = 'FUIDesklet';
	}

	fui.Desklet.prototype.addButton = function( button )
	{
	}

	fui.Desklet.prototype.addMenu = function( menu )
	{
	}
}, 'View' );
