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
	const body = data.body;
	const icon = data.icon;
	const tag = 'friendos-tag';
	event.waitUntil(
		self.registration.showNotification( title, {
			body: body,
			icon: icon,
			tag: tag,
			vibrate: [ 300, 100, 400 ],
			url: data.url
		} )
	);
} );

self.addEventListener( 'notificationclick', event => {
	try
	{
		event.notification.close();
		const data = event.data?.json() ?? {};
		let test = encodeURIComponent( event.data );
		console.log( 'Event debug:' );
		for( let a in event )
		{
			console.log( a + ' -> ' + event[ a ] );
		}
		console.log( 'Data debug: ' );
		for( let a in data )
		{
			console.log( a + ' -> ' + data[ a ] );
		}
		event.waitUntil( clients.openWindow( data && data.url ? data.url : 'https://intranet.friendup.cloud/webclient/index.html?fallback=true&webpush=' + test ) );
	}
	catch( e )
	{
		console.log( 'Error with service worker click: ', e );
	}
} );

