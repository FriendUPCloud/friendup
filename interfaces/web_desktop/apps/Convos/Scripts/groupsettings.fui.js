/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIGroupSettings extends FUIInviteDialog
{
	constructor( options )
	{
		super( options );
		
		this.initialized = true;
	}
}

FUI.registerClass( 'groupsettings', FUIInviteDialog );
