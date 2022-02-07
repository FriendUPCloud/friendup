/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
