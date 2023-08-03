/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

self.addEventListener( 'push', event => {
	console.log( 'Push event: ', event );
	
	try
	{
		const options = {
			body: event.data.text(),
			icon: '/graphics/system/friendos192.png',
			vibrate: [100, 50, 100],
			data: {
				url: document.location.href
			}
		};

		event.waitUntil(
			self.registration.showNotification( 'Friend OS', options )
		);
	}
	catch( e )
	{
		console.log( 'Error with service worker: ', e );
	}
} );

self.addEventListener( 'notificationclick', event => {
	console.log( 'Notification click event: ', event );
	
	try
	{
		event.notification.close();
		event.waitUntil(
			clients.openWindow( event.notification.data.url )
		);
	}
	catch( e )
	{
		console.log( 'Error with service worker click: ', e );
	}
} );

