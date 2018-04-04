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
