/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	Application.init();
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.init = function()
{

	var m = new Module( 'store' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{	
			var tmp;
			try {
				tmp = JSON.parse( d );
			}
			catch(e)
			{
				Application.displayError('Settings were not JSON' + d );
			}
			
			//expected answer is [0] settings [1] userhash
			Application.storeauth = tmp.authurl  + tmp.authkey + '&friendurl=' + encodeURIComponent( tmp.myurl );
			Application.authorizeAtStore();
		}
		else
		{
			Application.displayError( 'Settings could not be loaded' );
		}
	}	
	m.execute( 'loadsettings' );
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.authorizeAtStore = function()
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	    	
	    	data = false;
	    	try
	    	{
	    		data = JSON.parse( this.responseText);
	    	}
	    	catch(err)
	    	{
	    		Application.displayError('authorizeAtStore answer was not JSON. ' + this.responseText);
	    		return;
	    	}
	    	
	    	if(data && data.shopurl)
	    	{
				Application.shopdata = data;
				Application.showShop();
	    	}
	    	else
	    	{
		    	Application.displayError('Unexpected response from FriendStore. No Shop URL found.' + this.responseText);
	    	}
	    	
			
		}
	};

	xhttp.open("POST", Application.storeauth, true);
	xhttp.send();
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.showShop = function()
{
	var v = new View( {
		title: i18n( 'FriendStore' ),
		width: 720,
		height: 480,
		allowScrolling: true
	} );
	this.mainView = v;
	
	v.onClose = function(){ Application.quit(); }
	v.setRichContentUrl( Application.shopdata.shopurl + '&friendurl=' + window.location.protocol + '//' + window.location.host );
	

}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.handleKeys = function ( kc, event )
{
	console.log('Key handlet...', kc , 'evt:',event);	
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.receiveMessage = function( msg )
{
	if( msg.command == 'nevergonnagethere' || msg.command == 'nevergonnagethere')
	{
		//Application.mainView.sendMessage( msg );
	}
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.displayError = function(errmsg)
{
	// Make a new window with some flags
	var v = new View( {
		title: 'FriendStore Error',
		width: 480,
		height: 240
	} );	
	v.onClose = function()
	{
		Application.quit();
	}
	v.setContent('<h1 style="color:#F00; padding:32px; border:4px solid #F00; margin:32px; border-radius:8px;">'+ errmsg +'</h1>');
}