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

Application.proxy = '';
Application.friendsession = '';
Application.run = function( msg )
{
	var v = new View( {
		title:  i18n( 'i18n_wideweb' ),
		width:  900,
		height: 600
	} );

	v.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_about_wideweb' ),
					command: 'about'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'i18n_navigate' ),
			items: [
				{
					name: i18n( 'i18n_nav_back' ),
					command: 'navback'
				},
				{
					name: i18n( 'i18n_nav_forward' ),
					command: 'navforward'
				},
				{
					name: i18n( 'i18n_nav_reload' ),
					command: 'reload'
				}
			]
		},
		{
			name: i18n( 'i18n_bookmarks' ),
			items: [
				{
					name: 'FriendUP',
					command: 'navto:https://friendup.cloud/'
				},
				{
					name: 'FriendUP Developers',
					command: 'navto:https://developers.friendup.cloud/'
				},
				{
					name: 'Friend Software Corporation',
					command: 'navto:https://friendsoftware.cloud/'
				},
				{
					name: 'Slashdot.org',
					command: 'navto:https://slashdot.org/'
				}
			]
		}/*,
		{
			name: i18n( 'i18n_edit' ),
			items: [
			]
		}*/
	] );

	this.mainView = v;

	v.onClose = function( data )
	{
		Application.quit();
	}

	Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) );
	var f = new File( 'Progdir:Templates/webinterface.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			if( msg.args )
			{
				v.sendMessage( {
					command: 'loadfile',
					filename: msg.args
				} );
			}
		} );
	}
	f.load();

}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;

	if( msg.command.substr( 0, 6 ) == 'navto:' )
	{
		var url = msg.command.substr( 6, msg.command.length - 6 );
		msg.command = 'seturl';
		msg.url = url;
	}

	switch( msg.command )
	{
		case 'setcontent':
			Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) + ' - ' + msg.url );
			this.currentUrl = msg.url;
			break;
		case 'seturl':
			if ( msg.url.indexOf( 'WideWeb/Templates/about.html' ) < 0 && msg.url != this.currentUrl )
			{
				this.currentUrl = msg.url;
				Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) + ' - ' + msg.url );
				if( !msg.logic )
					this.mainView.sendMessage( { command: 'loadfile', filename: this.currentUrl } );
			}
			break;
		case 'updateproxy':
			Application.mainView.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );
			break;
		case 'reload':
			this.receiveMessage( { command: 'seturl', url: this.currentUrl ? this.currentUrl : "" } );
			this.mainView.sendMessage( { command: 'loadfile', filename: this.currentUrl } );
			break;
		case 'forward':
			this.mainView.sendMessage( { command: 'forward' } );
			break;
		case 'backward':
			this.mainView.sendMessage( { command: 'backward' } );
			break;
		case 'activate_now':
			this.mainView.activate();
			break;
		case 'about':
			if( this.ab )
			{
				return;
			}
			this.ab = new View( {
				title: i18n( 'i18n_about_wideweb' ),
				width: 300,
				height: 400
			} );
			var f = new File( 'Progdir:Templates/about.html' );
			f.onLoad = function( data )
			{
				Application.ab.setContent( data );
			}
			f.i18n();
			f.load();
			this.ab.onClose = function()
			{
				Application.ab = false;
			}
			break;
	}
}
