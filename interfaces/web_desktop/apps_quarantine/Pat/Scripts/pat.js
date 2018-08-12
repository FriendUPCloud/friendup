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

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##
Application.run = function( msg )
{
	Application.runChecks();
	console.log('We pat a bit...');
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.runChecks = function()
{
	var m = new Module('mail');
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			console.log( d );
			
			var tmp;
			try
			{
				tmp = JSON.parse( d );
			}
			catch(e)
			{
				console.log('answer was not JSON...',d);	
				return;
			}
			
			Application.patconfig = tmp;


			Application.showPat();
		
		}
		else
			Application.displayError('Pat configuration could not be loaded.',e,d);
	}
	m.execute( 'initpat' );
	console.log('Module called...');
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.showPat = function()
{


	var w = new View( {
		title: 'Pat',
		width: 900,
		height: 700
	} );
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	this.w = w;
	
	var f = new File( 'Progdir:Templates/pat.html' );
	f.replacements = {
		'pathost': Application.patconfig.url,
		'patuser': Application.patconfig.user,
		'patpass': Application.patconfig.pass
	};	
	
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			w.sendMessage({'command':'launch'});
		}
		);
		w.setMenuItems( [
		{
			name: i18n( 'menu_File' ),
			items: [
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		}
		]);
	}
	f.load();
	
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.displayError = function(errmsg)
{
	// Make a new window with some flags
	var v = new View( {
		title: 'Pat Error',
		width: 480,
		height: 240
	} );	
	v.onClose = function()
	{
		Application.quit();
	}
	v.setContent('<h1 style="color:#F00; padding:32px; border:4px solid #F00; margin:32px; border-radius:8px;">'+ errmsg +'</h1>');
}

// ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ##  ## == ## 
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( msg.command == 'accounts' )
	{
		if( this.accountsw )
		{
			return;
		}
		this.accountsw = new View( {
			title: i18n( 'title_accounts' ),
			width: 600,
			height: 400
		} );
		
		var ac = this.accountsw;
		
		var f = new File( 'Progdir:Templates/accounts.html' );
		f.onLoad = function( data )
		{
			ac.setContent( data );
		}
		f.load();
	}
	else if( msg.command == 'closeaccounts' )
	{
		if( this.accountsw )
		{
			this.accountsw.close();
			this.accountsw = false;
		}
	}
}

