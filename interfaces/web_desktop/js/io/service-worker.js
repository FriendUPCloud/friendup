/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

self.addEventListener( 'push', ( event ) => {
	if( !(self.Notification && self.Notification.permission === 'granted' ) ) 
	{
		return;
	}
	const data = event.data?.json() ?? {};
	const title = data.title || 'Something Has Happened';
	const message =
		data.message || 'Here\'s something you might want to check out.';
	const icon = '/graphics/system/friendos192.png';

	const notification = new self.Notification( title, {
		body: message,
		tag: "friend-os-message",
		icon
	} );
} );

self.addEventListener( 'notificationclick', event => {
	try
	{
		event.notification.close();
		
		const data = event.data?.json() ?? {};
		
		event.waitUntil(
			clients.openWindow( data ? data.url : 'https://intranet.friendup.cloud' )
		);
	}
	catch( e )
	{
		console.log( 'Error with service worker click: ', e );
	}
} );

