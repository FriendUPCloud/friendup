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

fui.addClass( function()
{
	// Inherit from group
	fui.Input = fui.inherit( fui.Group.prototype );

	fui.Input.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'focus':
				if( value === true || value === false )
				{
					this.flags.focus = value;
					return true;
				}
				break;
		}
	}

	fui.Input.prototype.show = function( bool )
	{
		this.flags.height = 25;
		this.baseDivs = [ {
			type: 'input_text', 
			className: 'FUIInput', 
			width: this.flags.width, 
			height: this.flags.height,
			focus: this.flags.focus,
			label: 'content',
			name: this.flags.name ? this.flags.name : false
		} ];
	}

	// Clear the input
	fui.Input.prototype.clear = function()
	{
		this.dom.value = '';
	}

	// Clear the input
	fui.Input.prototype.getValue = function()
	{
		return this.dom.value;
	}
}, 'Group' );
