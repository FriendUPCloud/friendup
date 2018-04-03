/*©*****************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              * 
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, interface )
{
	// we need HTTPS for a valid redrect URL. We use friendos.com for that now
	// Dropbox has one URL for each instance.
	var w = new View( { title: 'Dropbox Authorisation', width: 500, height: 280 } );
	w.setFlag('allowPopups', true);
	
	w.setContent('<script src="https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js"></script><div style="padding:25px;"><h1>Dropbox authorisation needed</h1><p>To enable FriendUP to access your Dropbox account you need to grant access once. You can revoke that access at any given time in your Dropbox settings</p><p><a href="javascript:void(0)" onclick="'+ Application.getLoginCode() +'" class="Button fa-dropbox IconSmall"> &nbsp; Click to enable Dropbox access</a></p></div>');
	
}

// TODO: Have a check to see if the client accepts popup windows if not use tab if possible ...

Application.getLoginCode = function( redirecturl )
{
	var ret = '';
	
	ret+= '             var origin = \'{redirect_uri}\'; ';
	ret+= '             origin = ( origin ? origin : document.origin + \'/loginprompt/oauth\' ); ';
	ret+= '				var winwidth = Math.min(600, screen.availWidth);';
	ret+= '				var winheight = Math.min(750, screen.availHeight);';
	ret+= '				var leftpos = Math.floor( (screen.availWidth - winwidth) / 2  );';
	ret+= '				var toppos = Math.floor( (screen.availHeight - winheight) / 2  );';
	ret+= '			    loginwindow = window.open(\'{dropboxurl}&redirect_uri=\' + origin,\'authwindow\',\'width=\'+ ( winwidth )  +\',height=\' + ( winheight ) +\',top=\' + ( toppos ) + \',left=\' + ( leftpos ) + \'\');';							
	
	ret+= '             window.addEventListener( \'message\', function( msg ) { if( msg && msg.data.url ){ ';
	//ret+= '			console.log( \'oauth msg: \', msg.data.url ); ';
	
	ret+= '				var token = msg.data.url.split(\'#access_token=\')[1].split(\'&\')[0]; ';
	
	//ret+= '			var dbx = new Dropbox( { accessToken: token } );	                                                  ';
	//ret+= '			dbx.filesListFolder( { path: \'\' } )         				                                          ';
	//ret+= ' 			.then( function( response ) { 																          ';
	
	ret+= '			    Application.keyData.save( ( Application.appPath ? Application.appPath.split(\':\')[0].toLowerCase() : \'dropbox\' ), msg.data.url, true, function( e, d ) { ';
	//ret+= '           console.log( { e:e, d:d } );                                                                         ';
	ret+= '             } );                                                                                                 ';
	
	ret+= '             Application.sendMessage( { type: \'system\', command: \'refreshwindowbypath\', path: \'{path}\' } ); ';
	ret+= '             if( loginwindow ) loginwindow.close(); ';
	ret+= '             setTimeout( function(){ Application.quit(); }, 1000 );                                               ';
	
	//ret+= '           } )	                                                                                                 ';
	//ret+= ' 			.catch( function( error ) { console.log( error ); } );		                                         ';
	
	ret+= '				} } );                                                                                               ';
	
	return ret;
	
}


