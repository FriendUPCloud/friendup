/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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

