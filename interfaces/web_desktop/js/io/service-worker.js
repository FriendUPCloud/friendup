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
	let notification = event.data.json();
	event.waitUntil(
	    self.registration.showNotification( notification.title, notification.options )
	);
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

