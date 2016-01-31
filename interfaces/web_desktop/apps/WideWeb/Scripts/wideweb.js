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
	f.onLoad = function( data )
	{
		v.setContent( data );
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
	}
}



