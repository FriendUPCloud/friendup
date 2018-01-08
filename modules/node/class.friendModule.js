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

var mysql = require( 'mysql2' );

mysql.realEscapeString = function( str )
{
	return str.replace( 
		/[\0\x08\x09\x1a\n\r"'\\\%]/g, 
		function( char )
		{
			switch( char )
			{
				case "\0": return "\\0";
				case "\x08": return "\\b";
				case "\x09": return "\\t";
				case "\x1a": return "\\z";
				case "\n": return "\\n";
				case "\r": return "\\r";
				case "\"":
				case "'":
				case "\\":
				case "%":
					return "\\" + char; // prepends a backslash to backslash, percent,
					                    // and double/single quotes
			}
		}
	);
}

friendModule = function(){}

// Return the database
friendModule.prototype.getDatabase = function()
{
	return this.connection;
}

friendModule.prototype.openDatabaseConnection = function( conf )
{
	var promise = {};
	
	this.connection = mysql.createConnection( {
		host: conf.host,
		user: conf.login,
		password: conf.password,
		database: conf.dbname,
		port: conf.port
	} );
	this.connection.connect( function( err )
	{
		if( err )
		{
			//console.log( err );
			if( promise.then ) promise.then( false );
		}
		else
		{
			//console.log( 'We have connected.' );
			if( promise.then ) promise.then( true );
		}
	} );
	
	return promise;
}

// Return the database connection
friendModule.prototype.getDatabaseConnection = function()
{
	return this.connection;
}

friendModule.prototype.closeDatabaseConnection = function()
{
	if( this.connection )
	{
		return this.connection.destroy();
	}
}

friendModule.prototype.about = function()
{
	return 'Hello Friend Module';
}

// Finally, export class
module.exports = new friendModule();
