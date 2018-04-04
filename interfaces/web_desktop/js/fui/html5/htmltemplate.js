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

// Add TabButtons class
fui.addClass( function()
{
	fui.HTMLTemplate = fui.inherit( fui.Group.prototype );
	fui.HTMLTemplate.prototype.show = function( bool )
	{
		this.baseDivs = [ {
			type: 'div',
			className: 'FUIHTMLTemplate',
			width: '100%',
			height: '100%',
			label: 'content',
			name: this.flags.name ? this.flags.name : false
		} ];
	};
	fui.HTMLTemplate.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'file':
				this.flags.file = value;
				return true;
			case 'callback':
				this.flags.callback = value;
				return true;
		}
	}
	fui.HTMLTemplate.prototype.shown = function( ele )
	{
		if( this.flags.file )
		{
			var f = new File( this.flags.file );
			f.onLoad = function( data )
			{
				ele.innerHTML = ele;
				if( this.flags.callback )
				{
					try
					{
						eval( this.flags.callback );
					}
					catch( e )
					{
						console.log( 'Could not execute callback.' );
					}
				}
			}
			f.load();
		}
	};
}, 'Group' );

