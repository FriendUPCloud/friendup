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
	var w = new View( { title: 'Dropbox Authorisation', width: 400, height: 240 } );
	w.setFlag('allowPopups', true);
	w.setContent('<div style="padding:25px;"><h1>Dropbox authorisation needed</h1><p>To enable FriendUP to access your Dropbox account you need to grant access once. You can revoke that access at any given time in your Dropbox settings</p><p><a href="javascript:void();" onclick="'+ Application.getLoginCode() +'" class="Button fa-dropbox IconSmall"> &nbsp; Click to enable Dropbox access</a></p></div>');

}

Application.getLoginCode = function( redirecturl )
{
	var ret = '';
	ret+= '				var winwidth = Math.min(400, screen.availWidth);';
	ret+= '				var winheight = Math.min(400, screen.availHeight);';
	ret+= '				var leftpos = Math.floor( (screen.availWidth - winwidth) / 2  );';
	ret+= '				var toppos = Math.floor( (screen.availHeight - winheight) / 2  );';
	ret+= '				loginwindow = window.open(\'{dropboxurl}&redirect_uri={dropboxinterface}\',\'authwindow\',\'width=\'+ ( winwidth )  +\',height=\' + ( winheight ) +\',top=\' + ( toppos ) + \',left=\' + ( leftpos ) + \'\');';							

	return ret;
	
}