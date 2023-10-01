/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	FUI.initialize();
}

// Send a message to a Friend OS user on the same server
Application.SendUserMsg = function( opts )
{
	if( !opts.recipientId ) return;
	
	let amsg = {
        'appname': 'FriendCreate',
        'dstuniqueid': opts.recipientId
    };
    if( opts.dstonly )
    {
    	amsg.dstonly = '1';
    }
    if( opts.message )
    {
    	amsg.msg = JSON.stringify( opts.message );
    }
    if( opts.callback )
    {
    	amsg.callback = 'yes';
	}
    let m = new Library( 'system.library' );
    m.execute( 'user/session/sendmsg', amsg );
}

