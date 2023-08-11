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
	const url = data.url;
	const tag = 'friendos-tag';
	
	function base64ToBytes( base64 )
	{
		const binString = atob( base64 );
		return Uint8Array.from( binString, ( m ) => m.codePointAt( 0 ) );
	}
	
	let text = decodeURIComponent( body );
    try
    {
        let dec = new TextDecoder().decode( base64ToBytes( text ) );
        text = dec;
    }
    catch( e2 ){};
	
	event.waitUntil(
		self.registration.showNotification( title, {
			body: text,
			icon: icon,
			tag: tag,
			data: { 
				url: url, 
				status: 'open' 
			},
			vibrate: [ 300, 100, 400 ]
		} )
	);
} );

self.addEventListener( 'notificationclick', event => {
	event.notification.close();
	event.waitUntil( ( async function()
	{
		let url = event.notification.data ? event.notification.data.url : false;
		clients.openWindow( url ? url : 'https://intranet.friendup.cloud/webclient/index.html' );
	} )() );
} );

