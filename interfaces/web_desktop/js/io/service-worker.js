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
	const data = event.data?.json() ?? {};
	const title = data.title;
	const body = '';
	const icon = data.icon;
	const tag = 'friendos-tag';
	event.waitUntil(
		self.registration.showNotification( title, {
			body: body,
			icon: icon,
			tag: tag,
			url: data.url
		} )
	);
} );

self.addEventListener( 'notificationclick', event => {
	try
	{
		event.notification.close();
		const data = event.data?.json() ?? {};
		if( data && data.url )
			event.waitUntil( clients.openWindow( data.url ) );
	}
	catch( e )
	{
		console.log( 'Error with service worker click: ', e );
	}
} );

