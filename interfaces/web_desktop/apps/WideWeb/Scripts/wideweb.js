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
Application.proxy = '';
Application.friendsession = '';
Application.run = function( msg )
{
	var v = new View( {
		title:  i18n( 'i18n_wideweb' ),
		width:  900,
		height: 600
	} );
	
	this.mainView = v;
	
	v.onClose = function( data )
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/webinterface.html' );
	
	// a couple of lines to set current host as default proxy for wideweb if no other setting isgiven for this user
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'fail' )
		{
			m = new Module( 'system' );
			m.onExecuted = function( e, d ) {
				console.log('prxy setting saved',e,d);
			}
			m.execute( 'setsetting', { setting: 'widewebproxy', data: location.protocol + '//proxy.' + location.host } );
		}
		else
		{
			tmp = JSON.parse( d );
			Application.proxy = tmp.widewebproxy;
			Application.mainView.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );
			console.log(Application.proxy + ' will be our proxy');
		}

	}
	m.execute( 'getsetting', { setting: 'widewebproxy' } );
	
	m2 = new Module('system')
	m2.onExecuted = function( e, d )
	{
		if( e == 'fail' )
		{
			console.log('User info get ERROR ', d);
		}
		else
		{
			tmp = JSON.parse( d );
			Application.friendsession = tmp.SessionID;
			Application.mainView.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );
			console.log('we got ousr sessionn here... didnt we?',tmp.SessionID,d,e);
		}
	}
	m2.execute('userinfoget' );
	
	f.onLoad = function( data )
	{
		v.setContent( data );
		v.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );

	}
	f.load();
	
	
	if( msg.args )
	{
		if( msg.args.indexOf( ':' ) > 0 && msg.args.indexOf( ':/' ) < 0 )
		{
			v.sendMessage( {
				command: 'loadfile',
				filename: msg.args
			} );
		}
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'seturl':
			Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) + ' : ' + msg.url );
			break;
		case 'updateproxy':
			Application.mainView.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );
			break;
	}
}



