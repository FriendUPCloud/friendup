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
}

// Set up our tabs!
var vtabs = new VertTabContainer( ge( 'VTabs' ) );
var tabs = [
	{
		name:  'Language',
		label: 'Language settings',
		pageDiv: ge( 'VPage1' )
	},
	{
		name:  'Code',
		label: 'Code editor',
		pageDiv: ge( 'VPage2' )
	},
	{
		name:  'Features',
		label: 'Feature settings',
		pageDiv: ge( 'VPage3' )
	}
];
for( var a = 0; a < tabs.length; a++ )
{
	vtabs.addTab( tabs[a] );
}

function doCancel()
{
	Application.sendMessage( {
		command: 'closeprefs'
	} );
}

