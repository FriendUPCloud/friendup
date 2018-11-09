/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

function ( tableName )
{
	this.tableName = tableName;	
	
	this.CreateData = function ()
	{
		var o = new Object ();
		for ( var i in this )
		{
			switch ( i )
			{
				case 'Find':
				case 'FindSingle':
				case 'CreateData':
				case 'Load':
				case 'OnData':
					continue;
				default:
					o[i] = this[i];
					break;
			}
		}
		return o;
	}
	
	this.Query = function ()
	{
		var d = JSON.stringify ( this.CreateData () );
		var j = new cAjax ();
		j.open ( 'post', 'admin.php?module=files&command=dbio', true, true );
		j.addVar ( 'data', d );
		j.addVar ( 'app', appName );
		var o = this;
		j.onload = function ()
		{
			if ( o.OnData )
			{
				if ( this.returnCode == 'ok' )
					return o.OnData ( JSON.parse ( this.returnData ) );
				return o.OnData ( false );
			}
		}
		j.send ();
	}
}


