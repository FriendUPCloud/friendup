/*******************************************************************************
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
*******************************************************************************/

Application.run = function( msg, iface )
{
	var v = new View( {
		title: i18n( 'i18n_account' ),
		width: 400,
		height: 390
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = v;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var s = JSON.parse( d );
		var f = new File( 'Progdir:Templates/main.html' );
		f.onLoad = function( data )
		{
			v.setContent( data );
			s.command = 'userinfo';
			v.sendMessage( s );
		}
		f.load();
	}
	m.execute( 'userinfoget', { id: msg.userId } );	
}


Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	if( msg.command == 'saveresult' )
	{
		this.mainView.setFlag( 'title', i18n( 'i18n_account' ) + ( msg.result == 'ok' ? ' (saved)' : ' (failed to save)' ) );
		setTimeout( function()
		{
			Application.mainView.setFlag( 'title', i18n( 'i18n_account' ) );
		}, 1000 );
		
		// Update login in Workspace!
		if( msg.result == 'ok' )
		{
			Application.sendMessage( {
				type: 'system',
				command: 'updatelogin',
				username: msg.data.Name,
				password: msg.data.Password
			} );
		}
	}
}
