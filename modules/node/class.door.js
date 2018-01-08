/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

var mysql = mysql || require( 'mysql2' );

door = function(){  }
door.prototype.setDatabase = function( db )
{
	this.ndb = db;
}

door.prototype.setFriendConfig = function( fc )
{
	this.friendConfig = fc;
}


door.prototype.identify = function( type, sessionid )
{
	var promise = {};
	
	var safetype = mysql.realEscapeString( type );
	var safesession = mysql.realEscapeString( sessionid );
	this.ndb.execute( '\
		SELECT * FROM `Filesystem` f, `FUser` u \
		WHERE `Type`="' + safetype + '" AND u.SessionID="' + safesession + '" AND f.UserID = u.ID\
	', function( err, rows, fields )
	{
		if( promise.then )
		{
			if( err )
			{
				return promise.then( false );
			}
			return promise.then( rows[ 0 ] );
		}
	} );
	
	return promise;
}

door.prototype.about = function()
{
	return 'Hello';
}

// Prototype for directory views
door.prototype.directory = function()
{
}

// Finally, export class
module.exports = door;

	
