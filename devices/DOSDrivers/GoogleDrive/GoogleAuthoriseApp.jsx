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
	
	var w = new View( { title: 'Google Drive Authorisation', width: 500, height: 340 } );
	w.setFlag('allowPopups', true);
	w.setContent('<div style="padding:25px;"><h1>Google Drive authorisation needed</h1><p>To enable FriendUP to access your Google Drive you need to grant access once. You can revoke that access at any given time in your Google Drive settings</p><p><a href="javascript:void(0)" onclick="'+ Application.getLoginCode() +'" class="Button fa-google IconSmall"> &nbsp; Click to go enable Google Drive access</a></p></div>');

}

Application.getLoginCode = function()
{
	var ret = '';
	
	ret+= '             var retries = 0; ';
	ret+= '             var origin = document.origin + \'/loginprompt/oauth.html\'; ';
	ret+= '				var winwidth = Math.min(600, screen.availWidth); ';
	ret+= '				var winheight = Math.min(450, screen.availHeight); ';
	ret+= '				var leftpos = Math.floor( (screen.availWidth - winwidth) / 2  ); ';
	ret+= '				var toppos = Math.floor( (screen.availHeight - winheight) / 2  ); ';
	ret+= '			    loginwindow = window.open(\'{googleurl}\',\'authwindow\',\'width=\'+ ( winwidth )  +\',height=\' + ( winheight ) +\',top=\' + ( toppos ) + \',left=\' + ( leftpos ) + \'\'); ';						
	
	ret+= '             window.addEventListener( \'message\', function( msg ) { if( msg && msg.data.url ){ ';
	//ret+= '			console.log( \'oauth msg: \', msg.data.url ); ';
	
	// https://developers.google.com/identity/protocols/oauth2/openid-connect
	
	ret+= '             if( msg.data.url.indexOf( \'access=\' ) >= 0 ){ ';
	
	ret+= '			    Application.keyData.save( ( Application.appPath ? Application.appPath.split(\':\')[0].toLowerCase() : \'googledrive\' ), msg.data.url, true, function( e, d ) {               ';
	//ret+= '           console.log( { e:e, d:d } );                                                                  ';
	ret+= '             } );                                                                                          ';
	
	ret+= '             Application.sendMessage( { type: \'system\', command: \'refreshwindowbypath\', path: \'{path}\' } ); ';
	ret+= '             if( loginwindow ) loginwindow.close(); ';
	ret+= '             setTimeout( function(){ Application.quit(); }, 1000 );                                               ';
	
	ret+= '             } ';
	ret+= '             else if( retries > 1 ) ';
	ret+= '             { ';
	ret+= '				console.log( \'oauth msg: \', msg.data.url ); ';
	ret+= '             alert( \'something went wrong, contact your administrator.\' ) ';
	ret+= '             }';
	ret+= '             else ';
	ret+= '             { ';
	ret+= '             retries++; ';
	ret+= '             console.log( \'retrying ... [\' + retries + \']\' ); ';
	ret+= '			    loginwindow = window.open(\'{googleurl}\',\'authwindow\',\'width=\'+ ( winwidth )  +\',height=\' + ( winheight ) +\',top=\' + ( toppos ) + \',left=\' + ( leftpos ) + \'\'); ';
	ret+= '             } ';
	
	ret+= '				} } ); ';
	
	return ret;
	
}
