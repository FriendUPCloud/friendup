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
	var v = new View( {
		title: i18n( 'i18n_startup_appname' ),
		width: 500,
		height: 500
	} );
	
	var f = new File( 'Progdir:Templates/startup.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'setparentviewid', viewid: v.getViewId() } );
		} );
	}
	f.load();
	
	// Goodbye on close
	v.onClose = function()
	{
		Application.quit();
	}
}

Application.receiveMessage = function( msg )
{

}

