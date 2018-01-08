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


