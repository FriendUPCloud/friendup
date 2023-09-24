/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Just start the collaboration window, to add people to the current session
let collabWin = null;
function collabInvite()
{
	if( collabWin ) return collabWin.activate();
	
	collabWin = new View( {
		title: i18n( 'i18n_invite_user' ),
		width: 480,
		height: 480,
		assets: [
			'Progdir:Templates/collaboration_invite.html',
			'Progdir:Scripts/fui.invitedialog.js',
			'Progdir:Scripts/fui.invitedialog.css',
			'Progdir:Scripts/invitedialog.js'
		]
	} );
	collabWin.onClose = function()
	{
		collabWin = null;
	}
}
