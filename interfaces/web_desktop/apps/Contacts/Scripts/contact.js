/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	
};

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	if( msg.command == 'setdata' )
	{
		for( let a in msg.data )
		{
			// Value element
			if( ge( 'inp' + a ) )
			{
				ge( 'inp' + a ).value = msg.data[ a ];
			}
			// Need to search for it
			else
			{
				var inps = ge( 'Form' ).getElementsByTagName( 'input' );
				for( let v = 0; v < inps.length; v++ )
				{
					if( inps[ v ].type == 'radio' && inps[ v ].name == 'inp' + a && inps[ v ].getAttribute( 'key' ) == msg.data[ a ] )
					{
						inps[ v ].click();
						break;
					}
				} 
			}
		}
	}
};
