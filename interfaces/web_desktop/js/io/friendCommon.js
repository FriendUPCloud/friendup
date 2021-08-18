/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

window.Friend = window.Friend || {};

/*
	Renewing auth id can not be directly allowed from within an app, but
	must be done from workspace. This is to prevent	apps from creating an 
	authId for another app by passing its name.
	
	This function should be the only one used to renew an authId. Multiple
	requests for the same app in a short timeframe result in only a single
	call to FC and all have the same authId returned. Timeframe is set to
	2 seconds.
	
	returns a promise that resolves to either of
		new authId 
		false, if one could not be obtained
		
*/
Friend.authIdRequests = {};
Friend.renewAuthId = async function( appId )
{
	const self = this;
	console.log( 'renewAuthId', appId );
	if ( null == appId )
		throw new Error( 'Friend.renewAuthId - missing appId' );
	
	const app = findApplication( appId );
	if ( null == app ) {
		console.log( 'Friend.renewAuthId - no app for appId', appId );
		return false;
	}
	
	console.log( 'app', {
		app    : app,
		authId : app.authId,
	});
	
	/*
	if ( null == app.authId ) {
		console.log( 'Friend.renewAuthId - app.authId is already being updated', app.authId );
		return;
	}
	*/
	const appName = app.applicationName;
	//const oldAuthId = app.authId;
	app.authId = null;
	const args = {
		appname : appName,
	};
	
	let authId = null;
	let reqState = Friend.authIdRequests[ appId ];
	if ( null == reqState ) {
		const loader = fetch( args );
		reqState = {
			appId  : appId,
			loader : loader,
		};
		Friend.authIdRequests[ appId ] = reqState;
	}
	setTimer( reqState );
	
	console.log( 'reqState', reqState );
	try {
		authId = await waitFor( reqState.loader );
	} catch( ex ) {
		console.log( 'Friend.renewAuthId, FC fetch failed', ex );
		return false;
	}
	
	console.log( 'fresh authId', {
		authId     : authId,
		appWindows : app.windows,
		content    : app.contentWindow,
		wIds       : Object.keys( app.windows ),
	});
	
	if ( app.authId !== authId ) {
		app.authId = authId;
		const authMsg = {
			type    : 'system',
			command : 'setauthid',
			data    : {
				authId : authId,
			}
		};
		broadcastToAppContexts( appId, authMsg );
	}
	
	return authId;
	
	function fetch( args )
	{
		console.log( 'fetch', args );
		return new Promise(( resolve, reject ) => {
			const req = new Library();
			req.execute( 'app/authidrenew', args );
			req.onExecuted = ( r, d ) => {
				console.log( 'Friend.renewAuthId result', [ r, d ]);
				const ok = ( r.result == 'success' );
				if ( !ok )
					reject( r );
				else
					resolve( r.authid );
			}
		});
	}
	
	function waitFor( loader )
	{
		console.log( 'waitfor', loader );
		return new Promise(( resolve, reject ) => {
			loader
				.then( resolve )
				.catch( reject );
		});
	}
	
	function setTimer( reqState )
	{
		console.log( 'setTimer', reqState );
		if ( null != reqState.timeout )
			window.clearTimeout( reqState.timeout );
		
		reqState.timeout = window.setTimeout( clear, 2000 );
		function clear()
		{
			console.log( 'clear', reqState );
			const appId = reqState.appId;
			reqState.timeout = null;
			delete Friend.authIdRequests[ appId ];
		}
	}
}
