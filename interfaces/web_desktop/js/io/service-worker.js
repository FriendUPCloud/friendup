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
} );

self.addEventListener( 'notificationclick', event => {
	event.notification.close();
	event.waitUntil(
		clients.openWindow( event.notification.data.url )
	);
} );

